import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { QuackPoll } from "@/features/quack/components/QuackPoll"

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  id: "p1",
  options: [
    { id: "o1", text: "Pizza", votes: 3 },
    { id: "o2", text: "Ramen", votes: 1 },
  ],
  totalVotes: 4,
  myVoteOptionId: null,
  ...overrides,
})

describe("QuackPoll", () => {
  it("shows counts, percentages and the total", () => {
    render(<QuackPoll poll={poll()} />)

    expect(screen.getByText("3 · 75%")).toBeInTheDocument()
    expect(screen.getByText("1 · 25%")).toBeInTheDocument()
    expect(screen.getByText("4 votes")).toBeInTheDocument()
  })

  it("shows zero percent and no division error for a poll without votes", () => {
    render(
      <QuackPoll
        poll={poll({
          options: [
            { id: "o1", text: "Pizza", votes: 0 },
            { id: "o2", text: "Ramen", votes: 0 },
          ],
          totalVotes: 0,
        })}
      />,
    )

    expect(screen.getAllByText("0 · 0%")).toHaveLength(2)
    expect(screen.getByText("0 votes")).toBeInTheDocument()
  })

  it("marks the option the user voted for", () => {
    render(<QuackPoll poll={poll({ myVoteOptionId: "o2" })} />)

    expect(screen.getAllByLabelText("Your vote")).toHaveLength(1)
  })
})
