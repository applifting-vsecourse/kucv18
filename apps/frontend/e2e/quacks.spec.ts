import { expect, test, type Page } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

async function findQuackNotBy(page: Page, username: string): Promise<{ id: string }> {
  const quacks: { id: string; user: { username: string } }[] = await (
    await page.request.get(`${API}/quacks`)
  ).json()
  return quacks.find((quack) => quack.user.username !== username)!
}

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

test("nobody can delete someone else's quack", async ({ page }) => {
  await signIn(page, "deepduckthoughts@example.com", "password2")
  await page.goto("/quacks")

  const othersQuack = page.getByRole("article").filter({ hasNotText: "@DeepDuckThoughts" }).first()
  await expect(othersQuack.getByRole("button", { name: "Delete quack" })).toHaveCount(0)

  // The button is hidden. Now skip the UI and ask the server directly.
  const notMine = await findQuackNotBy(page, "DeepDuckThoughts")
  const response = await page.request.delete(`${API}/quacks/${notMine.id}`)
  expect(response.status()).toBe(403)
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
