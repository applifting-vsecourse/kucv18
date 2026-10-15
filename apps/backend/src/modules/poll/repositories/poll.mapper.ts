import { Prisma } from '@/generated/prisma/client';
import { Poll } from '@/modules/poll/domain/poll';

// Counts come from the database (COUNT per option) on every read, nothing is
// stored, so the numbers cannot drift from the votes.
// The return type is inferred on purpose: Prisma derives the result type from it.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const pollInclude = (userId: string) =>
  ({
    options: {
      orderBy: { position: 'asc' },
      include: { _count: { select: { votes: true } } },
    },
    // At most one row: the unique (pollId, userId) pair.
    votes: { where: { userId }, select: { optionId: true } },
  }) satisfies Prisma.PollInclude;

export type PrismaPollWithCounts = Prisma.PollGetPayload<{
  include: ReturnType<typeof pollInclude>;
}>;

export const mapPrismaPollToDomain = (poll: PrismaPollWithCounts): Poll => {
  const options = poll.options.map((option) => ({
    id: option.id,
    text: option.text,
    votes: option._count.votes,
  }));
  return {
    id: poll.id,
    options,
    totalVotes: options.reduce((sum, option) => sum + option.votes, 0),
    myVoteOptionId: poll.votes[0]?.optionId ?? null,
  };
};
