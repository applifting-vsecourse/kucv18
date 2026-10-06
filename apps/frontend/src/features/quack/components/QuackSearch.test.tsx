import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { QuackSearch } from "@/features/quack/components/QuackSearch"

describe("QuackSearch", () => {
  afterEach(() => vi.useRealTimers())

  it("debounces typing into a single trimmed change", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onChange = vi.fn()
    render(
      <QuackSearch
        value=""
        onChange={onChange}
      />,
    )

    await user.type(screen.getByLabelText("Search"), " duck ")
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith("duck")
  })

  it("clears the term and keeps focus", async () => {
    const onChange = vi.fn()
    render(
      <QuackSearch
        value="duck"
        onChange={onChange}
      />,
    )

    const input = screen.getByLabelText("Search")
    expect(input).toHaveValue("duck")

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(onChange).toHaveBeenCalledWith("")
    expect(input).toHaveValue("")
    expect(input).toHaveFocus()
  })
})
