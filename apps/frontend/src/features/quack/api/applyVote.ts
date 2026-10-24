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

// Puts one poll back to how it was, leaving every other poll as it is now —
// so a failed vote doesn't erase an optimistic vote made in another poll.
export function restorePoll(current: Quack[], previous: Quack[], pollId: string): Quack[] {
  const before = previous.find((quack) => quack.poll?.id === pollId)?.poll
  if (!before) return current
  return current.map((quack) => (quack.poll?.id === pollId ? { ...quack, poll: before } : quack))
}

export function applyVote(quacks: Quack[], pollId: string, optionId: string): Quack[] {
  return quacks.map((quack) =>
    quack.poll?.id === pollId ? { ...quack, poll: applyVoteToPoll(quack.poll, optionId) } : quack,
  )
}
