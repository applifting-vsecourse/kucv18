import { PrismaService } from '@/core/prisma/prisma.service';
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
    await this.prisma.pollVote.upsert({
      where: { pollId_userId: { pollId: data.pollId, userId: data.userId } },
      create: data,
      update: { optionId: data.optionId },
    });
  }
}
