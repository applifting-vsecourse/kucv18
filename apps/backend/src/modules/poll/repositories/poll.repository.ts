import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { Poll } from '@/modules/poll/domain/poll';
import {
  mapPrismaPollToDomain,
  pollInclude,
} from '@/modules/poll/repositories/poll.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPoll(pollId: string, viewerId: string): Promise<Poll | null> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: pollInclude(viewerId),
    });
    return poll ? mapPrismaPollToDomain(poll) : null;
  }

  async optionBelongsToPoll(
    pollId: string,
    optionId: string,
  ): Promise<boolean> {
    const option = await this.prisma.pollOption.findFirst({
      where: { id: optionId, pollId },
      select: { id: true },
    });
    return option !== null;
  }

  /**
   * One row per (poll, user): the unique index makes this atomic, so a
   * person never ends up with zero or two votes while changing their mind.
   */
  async upsertVote(data: {
    pollId: string;
    optionId: string;
    userId: string;
  }): Promise<void> {
    const where = {
      pollId_userId: { pollId: data.pollId, userId: data.userId },
    };
    try {
      await this.prisma.pollVote.upsert({
        where,
        create: data,
        update: { optionId: data.optionId },
      });
    } catch (error) {
      // Two first votes from the same person (double submit, two tabs) can
      // both try to insert; the loser's row already exists, so update it.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
      await this.prisma.pollVote.update({
        where,
        data: { optionId: data.optionId },
      });
    }
  }
}
