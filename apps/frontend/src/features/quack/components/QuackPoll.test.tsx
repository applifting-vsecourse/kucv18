import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, Quack } from "@/features/quack/api/quackSchemas"
import { votePoll } from "@/features/quack/api/votePoll"
import { QuackPoll } from "@/features/quack/components/QuackPoll"

vi.mock("@/features/quack/api/votePoll", () => ({ votePoll: vi.fn() }))

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

const quackWith = (p: Poll): Quack => ({
  id: "q1",
  text: "Lunch?",
  mood: null,
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Duck", username: "duck" },
  poll: p,
})

// Stands in for the server: the feed query reads from this, like the real
// list endpoint does.
let serverQuacks: Quack[]

function Feed() {
  const { data } = useQuery({
    queryKey: quackKeys.list(""),
    queryFn: () => Promise.resolve(serverQuacks),
  })
  const current = data?.[0]?.poll
  return current ? <QuackPoll poll={current} /> : null
}

const renderFeed = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Feed />
    </QueryClientProvider>,
  )
}

describe("QuackPoll", () => {
  beforeEach(() => {
    vi.mocked(votePoll).mockReset()
    serverQuacks = [quackWith(poll())]
  })

  it("shows counts, percentages and the total", async () => {
    renderFeed()

    expect(await screen.findByText("3 · 75%")).toBeInTheDocument()
    expect(screen.getByText("1 · 25%")).toBeInTheDocument()
    expect(screen.getByText("4 votes")).toBeInTheDocument()
  })

  it("shows zero percent for a poll without votes", async () => {
    serverQuacks = [
      quackWith(
        poll({
          options: [
            { id: "o1", text: "Pizza", votes: 0 },
            { id: "o2", text: "Ramen", votes: 0 },
          ],
          totalVotes: 0,
        }),
      ),
    ]
    renderFeed()

    expect(await screen.findAllByText("0 · 0%")).toHaveLength(2)
    expect(screen.getByText("0 votes")).toBeInTheDocument()
  })

  it("marks the option the user voted for", async () => {
    serverQuacks = [quackWith(poll({ myVoteOptionId: "o2" }))]
    renderFeed()

    expect(await screen.findByRole("button", { name: /ramen/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: /pizza/i })).toHaveAttribute("aria-pressed", "false")
  })

  it("shows a first vote immediately, before the server answers", async () => {
    vi.mocked(votePoll).mockReturnValue(new Promise<Poll>(() => undefined))
    renderFeed()

    await userEvent.click(await screen.findByRole("button", { name: /ramen/i }))

    expect(await screen.findByText("2 · 40%")).toBeInTheDocument()
    expect(screen.getByText("5 votes")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /ramen/i })).toHaveAttribute("aria-pressed", "true")
  })

  it("moves a vote to another option and ends up with the server's numbers", async () => {
    serverQuacks = [quackWith(poll({ myVoteOptionId: "o1" }))]
    const after = poll({
      options: [
        { id: "o1", text: "Pizza", votes: 2 },
        { id: "o2", text: "Ramen", votes: 2 },
      ],
      myVoteOptionId: "o2",
    })
    vi.mocked(votePoll).mockImplementation(() => {
      serverQuacks = [quackWith(after)]
      return Promise.resolve(after)
    })
    renderFeed()

    await userEvent.click(await screen.findByRole("button", { name: /ramen/i }))

    await waitFor(() => expect(screen.getAllByText("2 · 50%")).toHaveLength(2))
    expect(screen.getByText("4 votes")).toBeInTheDocument()
    // TanStack passes an extra context argument, so only the payload is compared.
    expect(vi.mocked(votePoll).mock.calls[0][0]).toEqual({ pollId: "p1", optionId: "o2" })
  })

  it("sends nothing when clicking the option already chosen", async () => {
    serverQuacks = [quackWith(poll({ myVoteOptionId: "o1" }))]
    renderFeed()

    await userEvent.click(await screen.findByRole("button", { name: /pizza/i }))

    expect(votePoll).not.toHaveBeenCalled()
  })

  it("rolls the vote back and says so when the request fails", async () => {
    vi.mocked(votePoll).mockRejectedValue(new Error("Server unreachable"))
    renderFeed()

    await userEvent.click(await screen.findByRole("button", { name: /ramen/i }))

    expect(await screen.findByText(/Your vote didn't go through/)).toBeInTheDocument()
    expect(screen.getByText(/Server unreachable/)).toBeInTheDocument()
    expect(screen.getByText("1 · 25%")).toBeInTheDocument()
    expect(screen.getByText("4 votes")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /ramen/i })).toHaveAttribute("aria-pressed", "false")
  })
})
