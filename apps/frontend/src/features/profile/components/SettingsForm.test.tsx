import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { HTTPError } from "@/lib/api-client"

import { SettingsForm, type SavedSettings } from "@/features/profile/components/SettingsForm"

const saved: SavedSettings = {
  username: "caffeinatedduck",
  name: "Caffeinated Duck",
  bio: "",
  defaultMood: null,
}

const takenError = () =>
  new HTTPError(
    new Response(null, { status: 409 }),
    new Request("http://localhost/api/me"),
    {} as never,
  )

const setup = (onSave = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <SettingsForm
      saved={saved}
      onSave={onSave}
    />,
  )
  return { onSave, user: userEvent.setup() }
}

describe("SettingsForm", () => {
  it("starts with the saved values", () => {
    setup()

    expect(screen.getByLabelText("Username")).toHaveValue("caffeinatedduck")
    expect(screen.getByLabelText("Display name")).toHaveValue("Caffeinated Duck")
  })

  it("saves on Enter", async () => {
    const { onSave, user } = setup()

    await user.type(screen.getByLabelText("Username"), "_2{Enter}")

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave).toHaveBeenCalledWith({ ...saved, username: "caffeinatedduck_2" })
  })

  it("explains a username that is too short or has forbidden characters", async () => {
    const { onSave, user } = setup()
    const username = screen.getByLabelText("Username")

    await user.clear(username)
    await user.type(username, "ab{Enter}")
    expect(await screen.findByText("Username must be at least 3 characters")).toBeInTheDocument()

    await user.type(username, "c d{Enter}")
    expect(
      await screen.findByText("Use only letters, numbers, dots and underscores"),
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("puts the cursor on a cleared required field and says what is missing", async () => {
    const { onSave, user } = setup()
    const name = screen.getByLabelText("Display name")

    await user.clear(name)
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("Enter a display name")).toBeInTheDocument()
    expect(name).toHaveFocus()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("rejects a bio over 160 characters", async () => {
    const { onSave, user } = setup()

    await user.click(screen.getByLabelText("Bio (optional)"))
    await user.paste("x".repeat(161))
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("Bio must be at most 160 characters")).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("shows a taken username at the field and keeps what was typed", async () => {
    const { user } = setup(vi.fn().mockRejectedValue(takenError()))
    const username = screen.getByLabelText("Username")

    await user.clear(username)
    await user.type(username, "deepduckthoughts{Enter}")

    expect(await screen.findByText(/username is already taken/i)).toBeInTheDocument()
    expect(username).toHaveAttribute("aria-invalid", "true")
    expect(username).toHaveValue("deepduckthoughts")
    expect(username).toHaveFocus()
  })

  it("discards edits back to the saved values", async () => {
    const { user } = setup()
    const name = screen.getByLabelText("Display name")

    await user.type(name, " Jr.")
    await user.click(screen.getByRole("button", { name: "Discard changes" }))

    expect(name).toHaveValue("Caffeinated Duck")
  })
})
