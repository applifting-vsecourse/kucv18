import { PrismaService } from '@/core/prisma/prisma.service';
import {
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

const mapPrismaQuackToDomain = (
  quack: PrismaQuack & {
    user?: PrismaUser;
    poll?: PrismaPollWithCounts | null;
  },
): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood,
  userId: quack.userId,
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
});

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(viewerId: string, onlyMine = false): Promise<Quack[]> {
    const quacks = await this.prisma.quack.findMany({
      where: onlyMine ? { userId: viewerId } : undefined,
      include: { user: true, poll: { include: pollInclude(viewerId) } },
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map(mapPrismaQuackToDomain);
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: Mood;
    userId: string;
    pollOptions?: string[];
  }): Promise<Quack> {
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
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
      },
    });
    return mapPrismaQuackToDomain(quack);
  }

  async findQuackById(id: string): Promise<Quack | null> {
    const quack = await this.prisma.quack.findUnique({ where: { id } });
    return quack ? mapPrismaQuackToDomain(quack) : null;
  }

  // The poll, its options and votes go with the quack (onDelete: Cascade).
  async deleteQuack(id: string): Promise<void> {
    await this.prisma.quack.deleteMany({ where: { id } });
  }
}
