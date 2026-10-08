import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DEBOUNCE_MS, QuackSearch } from "@/features/quack/components/QuackSearch"

describe("QuackSearch", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const type = (value: string) =>
    fireEvent.change(screen.getByLabelText("Search"), { target: { value } })

  it("searches once, after the user stops typing", () => {
    const onSearch = vi.fn()
    render(
      <QuackSearch
        value=""
        onSearch={onSearch}
      />,
    )

    type("k")
    act(() => void vi.advanceTimersByTime(DEBOUNCE_MS - 100))
    type("  kocka ")
    expect(onSearch).not.toHaveBeenCalled()

    act(() => void vi.advanceTimersByTime(DEBOUNCE_MS))
    expect(onSearch).toHaveBeenCalledOnce()
    expect(onSearch).toHaveBeenCalledWith("kocka")
  })

  it("starts with the term from the URL", () => {
    render(
      <QuackSearch
        value="kocka"
        onSearch={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("Search")).toHaveValue("kocka")
  })

  it("has no search button", () => {
    render(
      <QuackSearch
        value=""
        onSearch={vi.fn()}
      />,
    )

    expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument()
  })

  it("searches immediately on Enter", () => {
    const onSearch = vi.fn()
    render(
      <QuackSearch
        value=""
        onSearch={onSearch}
      />,
    )

    type("duck")
    fireEvent.submit(screen.getByRole("search"))

    expect(onSearch).toHaveBeenCalledWith("duck")
  })

  it("resets the feed immediately when cleared", () => {
    const onSearch = vi.fn()
    render(
      <QuackSearch
        value=""
        onSearch={onSearch}
      />,
    )

    type("duck")
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))

    expect(screen.getByLabelText("Search")).toHaveValue("")
    expect(onSearch).toHaveBeenLastCalledWith("")
    act(() => void vi.advanceTimersByTime(DEBOUNCE_MS))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })
})
