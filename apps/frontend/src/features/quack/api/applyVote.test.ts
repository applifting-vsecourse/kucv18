import { describe, expect, it } from "vitest"

import { applyVoteToPoll } from "@/features/quack/api/applyVote"
import type { Poll } from "@/features/quack/api/quackSchemas"

const poll: Poll = {
  id: "p1",
  options: [
    { id: "o1", text: "Pizza", votes: 3 },
    { id: "o2", text: "Ramen", votes: 1 },
  ],
  totalVotes: 4,
  myVoteOptionId: null,
}

describe("applyVoteToPoll", () => {
  it("adds a first vote", () => {
    const result = applyVoteToPoll(poll, "o2")

    expect(result.options.map((o) => o.votes)).toEqual([3, 2])
    expect(result.totalVotes).toBe(5)
    expect(result.myVoteOptionId).toBe("o2")
  })

  it("moves a vote without changing the total", () => {
    const result = applyVoteToPoll({ ...poll, myVoteOptionId: "o1" }, "o2")

    expect(result.options.map((o) => o.votes)).toEqual([2, 2])
    expect(result.totalVotes).toBe(4)
    expect(result.myVoteOptionId).toBe("o2")
  })

  it("leaves a poll alone when the option is already chosen", () => {
    const voted = { ...poll, myVoteOptionId: "o1" }

    expect(applyVoteToPoll(voted, "o1")).toBe(voted)
  })
})
