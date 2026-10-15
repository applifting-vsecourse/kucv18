import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { addQuack } from "@/features/quack/api/addQuack"
import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackForm } from "@/features/quack/components/QuackForm"

vi.mock("@/features/quack/api/addQuack", () => ({ addQuack: vi.fn() }))

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuackForm />
    </QueryClientProvider>,
  )

const submit = () => userEvent.click(screen.getByRole("button", { name: "Quack" }))

describe("QuackForm poll fields", () => {
  beforeEach(() => {
    vi.mocked(addQuack).mockReset()
    vi.mocked(addQuack).mockResolvedValue({} as Quack)
  })

  it("hides the answers until 'Add a poll' is on", async () => {
    renderForm()

    expect(screen.queryByLabelText("Answer 1")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("switch", { name: "Add a poll" }))

    expect(screen.getByLabelText("Answer 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Answer 2")).toBeInTheDocument()
  })

  it("sends a plain quack without a poll", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "Hello")
    await submit()

    expect(vi.mocked(addQuack).mock.calls[0]?.[0]).toEqual({
      text: "Hello",
      mood: undefined,
      poll: undefined,
    })
  })

  it("sends the question and trimmed answers", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "Lunch?")
    await userEvent.click(screen.getByRole("switch", { name: "Add a poll" }))
    await userEvent.type(screen.getByLabelText("Answer 1"), "  Pizza ")
    await userEvent.type(screen.getByLabelText("Answer 2"), "Ramen")
    await submit()

    expect(vi.mocked(addQuack).mock.calls[0]?.[0]).toEqual({
      text: "Lunch?",
      mood: undefined,
      poll: { options: ["Pizza", "Ramen"] },
    })
  })

  it("tells the user about empty and duplicate answers and sends nothing", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "Lunch?")
    await userEvent.click(screen.getByRole("switch", { name: "Add a poll" }))
    await submit()
    expect(await screen.findAllByText("Write an answer")).toHaveLength(2)

    await userEvent.type(screen.getByLabelText("Answer 1"), "Pizza")
    await userEvent.type(screen.getByLabelText("Answer 2"), "pizza")
    await submit()

    expect(await screen.findByText("Answers must be different")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("adds answers up to six and removes down to two", async () => {
    renderForm()
    await userEvent.click(screen.getByRole("switch", { name: "Add a poll" }))

    for (let i = 0; i < 4; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Add answer" }))
    }
    expect(screen.getByLabelText("Answer 6")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add answer" })).not.toBeInTheDocument()

    for (let i = 0; i < 4; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Remove answer 1" }))
    }
    expect(screen.queryByLabelText("Answer 3")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /remove answer/i })).not.toBeInTheDocument()
  })

  it("ignores hidden answers when the poll is switched off again", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "Hi")
    await userEvent.click(screen.getByRole("switch", { name: "Add a poll" }))
    await userEvent.click(screen.getByRole("switch", { name: "Add a poll" }))
    await submit()

    expect(vi.mocked(addQuack).mock.calls[0]?.[0]).toMatchObject({ text: "Hi", poll: undefined })
  })
})
