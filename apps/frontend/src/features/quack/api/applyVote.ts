import type { Poll, Quack } from "@/features/quack/api/quackSchemas"

// Moves the user's vote to another option locally, the way the server will:
// one vote per person, so the old option loses one and the new one gains one.
export function applyVoteToPoll(poll: Poll, optionId: string): Poll {
  if (poll.myVoteOptionId === optionId) return poll
  return {
    ...poll,
    myVoteOptionId: optionId,
    totalVotes: poll.myVoteOptionId ? poll.totalVotes : poll.totalVotes + 1,
    options: poll.options.map((option) => {
      if (option.id === optionId) return { ...option, votes: option.votes + 1 }
      if (option.id === poll.myVoteOptionId) return { ...option, votes: option.votes - 1 }
      return option
    }),
  }
}

export function applyVote(quacks: Quack[], pollId: string, optionId: string): Quack[] {
  return quacks.map((quack) =>
    quack.poll?.id === pollId ? { ...quack, poll: applyVoteToPoll(quack.poll, optionId) } : quack,
  )
}
