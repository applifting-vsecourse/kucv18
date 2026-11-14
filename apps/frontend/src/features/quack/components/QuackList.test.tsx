// Example component test — the pattern to copy for your own components.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

const quack = (overrides: Partial<Quack> = {}): Quack => ({
  id: "q1",
  text: "quack quack",
  mood: null,
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  parentId: null,
  replyCount: 0,
  isDeleted: false,
  poll: null,
  ...overrides,
})

const renderWithClient = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

describe("QuackList", () => {
  it("renders quacks with author info", () => {
    render(<QuackList quacks={[quack()]} />)

    expect(screen.getByText("quack quack")).toBeInTheDocument()
    expect(screen.getByText("Caffeinated Duck")).toBeInTheDocument()
    expect(screen.getByText("@CaffeinatedDuck")).toBeInTheDocument()
  })

  it("shows the mood of a quack that has one", () => {
    render(<QuackList quacks={[quack({ mood: "angry" })]} />)

    expect(screen.getByText("Angry")).toBeInTheDocument()
  })

  it("shows no mood for a quack without one", () => {
    render(<QuackList quacks={[quack()]} />)

    for (const label of ["Happy", "Sad", "Angry", "Silly"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
  })

  it("shows a no-match message for an empty search result", () => {
    render(
      <QuackList
        quacks={[]}
        search="kocka"
      />,
    )

    expect(screen.getByText("No posts found matching: 'kocka'.")).toBeInTheDocument()
  })

  it("shows an error with a working reload button", async () => {
    const onReload = vi.fn()
    render(
      <QuackList
        quacks={[]}
        error={new Error("Server unreachable")}
        onReload={onReload}
      />,
    )

    expect(screen.getByText("Couldn't load quacks")).toBeInTheDocument()
    expect(screen.getByText("Server unreachable")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })

  it("offers Delete only on the current user's quacks", () => {
    renderWithClient(
      <QuackList
        quacks={[quack({ id: "mine" }), quack({ id: "theirs", userId: "u2", text: "not mine" })]}
        canDelete={(item) => item.userId === "u1"}
      />,
    )

    expect(screen.getAllByRole("button", { name: "Delete quack" })).toHaveLength(1)
  })

  it("offers an admin Delete on every quack", () => {
    renderWithClient(
      <QuackList
        quacks={[quack({ id: "mine" }), quack({ id: "theirs", userId: "u2", text: "not mine" })]}
        canDelete={() => true}
      />,
    )

    expect(screen.getAllByRole("button", { name: "Delete quack" })).toHaveLength(2)
  })

  it("asks before deleting", async () => {
    renderWithClient(
      <QuackList
        quacks={[quack()]}
        canDelete={(item) => item.userId === "u1"}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Delete quack" }))

    expect(screen.getByRole("dialog")).toHaveTextContent("Delete this quack?")
  })

  it("tells you when Mine is empty and offers to write the first quack", async () => {
    const onWriteFirst = vi.fn()
    render(
      <QuackList
        quacks={[]}
        isMineOnly
        onWriteFirst={onWriteFirst}
      />,
    )

    expect(screen.getByText("You haven't posted any quacks yet.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Write your first quack" }))
    expect(onWriteFirst).toHaveBeenCalledOnce()
  })
  describe("replies", () => {
    const threadLink = (quackId: string, label: string) => (
      <a href={`/quacks/${quackId}`}>{label}</a>
    )
    const tombstone = quack({
      id: "gone",
      text: null,
      userId: null,
      createdAt: null,
      user: null,
      isDeleted: true,
      replyCount: 2,
    })

    it("shows a deleted quack as a placeholder with nothing else", () => {
      render(
        <QuackList
          quacks={[tombstone]}
          renderThreadLink={threadLink}
        />,
      )

      expect(screen.getByText("This quack was deleted")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "2 replies" })).toHaveAttribute(
        "href",
        "/quacks/gone",
      )
      expect(screen.queryByText("Caffeinated Duck")).not.toBeInTheDocument()
    })

    it("never offers Delete on a deleted quack", () => {
      renderWithClient(
        <QuackList
          quacks={[tombstone]}
          canDelete={() => true}
        />,
      )

      expect(screen.queryByRole("button", { name: "Delete quack" })).not.toBeInTheDocument()
    })

    it("shows the reply count and links to the thread", () => {
      render(
        <QuackList
          quacks={[quack({ id: "a", replyCount: 1 }), quack({ id: "b", replyCount: 0 })]}
          renderThreadLink={threadLink}
        />,
      )

      expect(screen.getByRole("link", { name: "1 reply" })).toHaveAttribute("href", "/quacks/a")
      expect(screen.getByRole("link", { name: "Reply" })).toHaveAttribute("href", "/quacks/b")
    })

    it("links a reply (a search hit) to the thread it belongs to", () => {
      render(
        <QuackList
          quacks={[quack({ id: "r1", parentId: "q1" })]}
          renderThreadLink={threadLink}
        />,
      )

      expect(screen.getByRole("link", { name: "View thread" })).toHaveAttribute(
        "href",
        "/quacks/q1",
      )
    })

    it("tells the author the replies stay when deleting a quack that has replies", async () => {
      renderWithClient(
        <QuackList
          quacks={[quack({ replyCount: 3 })]}
          canDelete={() => true}
        />,
      )

      await userEvent.click(screen.getByRole("button", { name: "Delete quack" }))

      expect(screen.getByRole("dialog")).toHaveTextContent("The replies stay")
    })
  })
})
