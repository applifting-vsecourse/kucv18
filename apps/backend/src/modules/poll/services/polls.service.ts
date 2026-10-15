import { Poll } from '@/modules/poll/domain/poll';
import { PollRepository } from '@/modules/poll/repositories/poll.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class PollsService {
  constructor(private readonly pollRepository: PollRepository) {}

  async vote(user: Identity, pollId: string, optionId: string): Promise<Poll> {
    const poll = await this.pollRepository.getPoll(pollId, user.id);
    if (!poll) throw new NotFoundException('Poll not found');

    if (poll.myVoteOptionId !== optionId) {
      // Checked here for a clear 400; the composite foreign key in the
      // database enforces it too.
      if (!(await this.pollRepository.optionBelongsToPoll(pollId, optionId))) {
        throw new BadRequestException('Option does not belong to this poll');
      }
      // the voter is taken from the session, never from the request body
      await this.pollRepository.upsertVote({
        pollId,
        optionId,
        userId: user.id,
      });
    }

    // Always answer with the counts as they are now, not as of the first read.
    const updated = await this.pollRepository.getPoll(pollId, user.id);
    if (!updated) throw new NotFoundException('Poll not found');
    return updated;
  }
}
