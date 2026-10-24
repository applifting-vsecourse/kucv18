import { expect, test } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

test("author can post a quack and delete it", async ({ page }) => {
  const text = `E2E quack ${Date.now()}`
  await signIn(page, "caffeinatedduck@example.com", "password1")
  await page.goto("/quacks")

  await page.getByLabel("New quack").fill(text)
  await page.getByRole("button", { name: "Quack", exact: true }).click()
  const quack = page.getByRole("article").filter({ hasText: text })
  await expect(quack).toBeVisible()

  await quack.getByRole("button", { name: "Delete quack" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click()
  // While the dialog is open the rest of the page is hidden from the accessibility
  // tree, so "no such article" would pass even if the delete failed.
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(quack).toHaveCount(0)
})

test("nobody can delete someone else's quack", async ({ browser }) => {
  // The author creates the quack this test goes after, so a broken check can
  // only ever delete test data, never the seed.
  const text = `Not yours ${Date.now()}`
  const author = await browser.newPage()
  await signIn(author, "caffeinatedduck@example.com", "password1")
  const created = await author.request.post(`${API}/quacks`, { data: { text } })
  const { id } = (await created.json()) as { id: string }

  const other = await browser.newPage()
  await signIn(other, "deepduckthoughts@example.com", "password2")
  await other.goto("/quacks")

  const othersQuack = other.getByRole("article").filter({ hasText: text })
  await expect(othersQuack).toBeVisible()
  await expect(othersQuack.getByRole("button", { name: "Delete quack" })).toHaveCount(0)

  // The button is hidden. Now skip the UI and ask the server directly.
  const response = await other.request.delete(`${API}/quacks/${id}`)
  expect(response.status()).toBe(403)

  // Clean up after ourselves.
  await author.request.delete(`${API}/quacks/${id}`)
})

test("Mine shows only my quacks", async ({ page }) => {
  await signIn(page, "deepduckthoughts@example.com", "password2")
  await page.goto("/quacks")

  await page.getByRole("tab", { name: "Mine" }).click()
  await expect(page).toHaveURL(/view=mine/)
  await expect(page.getByRole("article").first()).toBeVisible()
  await expect(page.getByRole("article").filter({ hasNotText: "@DeepDuckThoughts" })).toHaveCount(0)
})

test("admin can delete someone else's quack", async ({ browser }) => {
  const text = `Spam ${Date.now()}`
  const author = await browser.newPage()
  await signIn(author, "caffeinatedduck@example.com", "password1")
  await author.request.post(`${API}/quacks`, { data: { text } })

  const admin = await browser.newPage()
  await signIn(admin, "admin@example.com", "adminpassword")
  await admin.goto("/quacks")

  const spam = admin.getByRole("article").filter({ hasText: text })
  await expect(spam).toBeVisible()
  await spam.getByRole("button", { name: "Delete quack" }).click()
  await admin.getByRole("dialog").getByRole("button", { name: "Delete" }).click()
  await expect(admin.getByRole("dialog")).toBeHidden()
  await expect(spam).toHaveCount(0)
})
