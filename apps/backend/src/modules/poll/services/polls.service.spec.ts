import { Poll } from '@/modules/poll/domain/poll';
import { PollRepository } from '@/modules/poll/repositories/poll.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { PollsService } from './polls.service';

const user = { id: 'u1' } as Identity;

const aPoll = (myVoteOptionId: string | null = null): Poll => ({
  id: 'p1',
  options: [
    { id: 'o1', text: 'Pizza', votes: 1 },
    { id: 'o2', text: 'Ramen', votes: 0 },
  ],
  totalVotes: 1,
  myVoteOptionId,
});

describe('PollsService', () => {
  it('records a first vote for the signed-in user and returns fresh counts', async () => {
    const repository = mock<PollRepository>();
    const after = aPoll('o2');
    repository.getPoll
      .mockResolvedValueOnce(aPoll())
      .mockResolvedValueOnce(after);
    repository.optionBelongsToPoll.mockResolvedValue(true);

    const service = new PollsService(repository);

    await expect(service.vote(user, 'p1', 'o2')).resolves.toEqual(after);
    expect(repository.upsertVote).toHaveBeenCalledWith({
      pollId: 'p1',
      optionId: 'o2',
      userId: 'u1',
    });
  });

  it('moves an existing vote to another option', async () => {
    const repository = mock<PollRepository>();
    repository.getPoll.mockResolvedValue(aPoll('o1'));
    repository.optionBelongsToPoll.mockResolvedValue(true);

    await new PollsService(repository).vote(user, 'p1', 'o2');

    expect(repository.upsertVote).toHaveBeenCalledWith({
      pollId: 'p1',
      optionId: 'o2',
      userId: 'u1',
    });
  });

  it('does nothing when voting for the option already chosen', async () => {
    const repository = mock<PollRepository>();
    repository.getPoll.mockResolvedValue(aPoll('o1'));

    await new PollsService(repository).vote(user, 'p1', 'o1');

    expect(repository.upsertVote).not.toHaveBeenCalled();
  });

  it('rejects an option from another poll', async () => {
    const repository = mock<PollRepository>();
    repository.getPoll.mockResolvedValue(aPoll());
    repository.optionBelongsToPoll.mockResolvedValue(false);

    await expect(
      new PollsService(repository).vote(user, 'p1', 'other'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.upsertVote).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown poll', async () => {
    const repository = mock<PollRepository>();
    repository.getPoll.mockResolvedValue(null);

    await expect(
      new PollsService(repository).vote(user, 'nope', 'o1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
