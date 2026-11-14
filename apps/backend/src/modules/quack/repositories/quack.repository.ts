import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Prisma,
  Quack as PrismaQuack,
  User as PrismaUser,
} from '@/generated/prisma/client';
import {
  mapPrismaPollToDomain,
  pollInclude,
  PrismaPollWithCounts,
} from '@/modules/poll/repositories/poll.mapper';
import { Mood, Quack } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';

type PrismaQuackRow = PrismaQuack & {
  user?: PrismaUser;
  poll?: PrismaPollWithCounts | null;
  _count?: { replies: number };
  replies?: PrismaQuackRow[];
};

const mapPrismaQuackToDomain = (quack: PrismaQuackRow): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood,
  userId: quack.userId,
  parentId: quack.parentId,
  deletedAt: quack.deletedAt,
  replyCount: quack._count?.replies ?? 0,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  user: quack.user
    ? {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username ?? '',
      }
    : undefined,
  poll: quack.poll ? mapPrismaPollToDomain(quack.poll) : null,
  replies: quack.replies?.map(mapPrismaQuackToDomain),
});

const withReplyCount = {
  _count: { select: { replies: true } },
} satisfies Prisma.QuackInclude;

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  // The feed: top-level quacks only, tombstones included so their replies
  // stay reachable. "Mine" hides the author's own tombstones.
  async getQuacks(viewerId: string, onlyMine = false): Promise<Quack[]> {
    const quacks = await this.prisma.quack.findMany({
      where: {
        parentId: null,
        ...(onlyMine ? { userId: viewerId, deletedAt: null } : {}),
      },
      include: {
        user: true,
        poll: { include: pollInclude(viewerId) },
        ...withReplyCount,
      },
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map(mapPrismaQuackToDomain);
  }

  // Search candidates: quacks AND replies, never tombstones (they have no
  // text and no exposed author, so there is nothing to match).
  async getSearchableQuacks(
    viewerId: string,
    onlyMine = false,
  ): Promise<Quack[]> {
    const quacks = await this.prisma.quack.findMany({
      where: {
        deletedAt: null,
        ...(onlyMine ? { userId: viewerId } : {}),
      },
      include: {
        user: true,
        poll: { include: pollInclude(viewerId) },
        ...withReplyCount,
      },
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map(mapPrismaQuackToDomain);
  }

  // One quack (or tombstone) with its replies, oldest first.
  async getThread(viewerId: string, id: string): Promise<Quack | null> {
    const quack = await this.prisma.quack.findUnique({
      where: { id },
      include: {
        user: true,
        poll: { include: pollInclude(viewerId) },
        ...withReplyCount,
        replies: {
          include: { user: true, ...withReplyCount },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return quack ? mapPrismaQuackToDomain(quack) : null;
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: Mood;
    userId: string;
    parentId?: string;
    pollOptions?: string[];
  }): Promise<Quack> {
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
        parent: createQuackData.parentId
          ? { connect: { id: createQuackData.parentId } }
          : undefined,
        // Nested create: quack, poll and options are written in one transaction.
        poll: createQuackData.pollOptions && {
          create: {
            options: {
              create: createQuackData.pollOptions.map((text, position) => ({
                text,
                position,
              })),
            },
          },
        },
      },
      include: {
        user: true,
        poll: { include: pollInclude(createQuackData.userId) },
        ...withReplyCount,
      },
    });
    return mapPrismaQuackToDomain(quack);
  }

  async findQuackById(id: string): Promise<Quack | null> {
    const quack = await this.prisma.quack.findUnique({
      where: { id },
      include: withReplyCount,
    });
    return quack ? mapPrismaQuackToDomain(quack) : null;
  }

  // docs/adr/0001: a quack with replies becomes a tombstone (content wiped),
  // one without replies is really deleted. Removing the last reply of a
  // tombstone removes the tombstone too, so a tombstone always has a reply.
  // The foreign key is `Restrict`, so the database refuses to hard-delete a
  // quack that still has replies even if this logic is ever wrong.
  async deleteQuack(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const quack = await tx.quack.findUnique({
        where: { id },
        include: withReplyCount,
      });
      if (!quack) return;

      if (quack._count.replies > 0) {
        // The poll, its options and votes go with it (onDelete: Cascade).
        await tx.poll.deleteMany({ where: { quackId: id } });
        await tx.quack.update({
          where: { id },
          data: { text: null, mood: null, deletedAt: new Date() },
        });
        return;
      }

      await tx.quack.delete({ where: { id } });

      if (quack.parentId) {
        const parent = await tx.quack.findUnique({
          where: { id: quack.parentId },
          include: withReplyCount,
        });
        if (parent?.deletedAt && parent._count.replies === 0) {
          await tx.quack.delete({ where: { id: parent.id } });
        }
      }
    });
  }
}
