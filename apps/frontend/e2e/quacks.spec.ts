import { expect, test, type Page } from "@playwright/test"

import { ADMIN, API, AUTHOR, OTHER } from "./accounts"
import { signIn } from "./signIn"

// Signs in on a fresh page and has that user post a quack through the API.
async function postQuackAs(
  page: Page,
  account: { email: string; password: string },
  text: string,
): Promise<string> {
  await signIn(page, account.email, account.password)
  const response = await page.request.post(`${API}/quacks`, { data: { text } })
  expect(response.status()).toBe(201)
  return ((await response.json()) as { id: string }).id
}

test("author can post a quack and delete it", async ({ page }) => {
  const text = `E2E quack ${Date.now()}`
  await signIn(page, AUTHOR.email, AUTHOR.password)
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
  const other = await browser.newPage()
  let id: string | undefined
  try {
    id = await postQuackAs(author, AUTHOR, text)
    await signIn(other, OTHER.email, OTHER.password)
    await other.goto("/quacks")

    const othersQuack = other.getByRole("article").filter({ hasText: text })
    await expect(othersQuack).toBeVisible()
    await expect(othersQuack.getByRole("button", { name: "Delete quack" })).toHaveCount(0)

    // The button is hidden. Now skip the UI and ask the server directly.
    const response = await other.request.delete(`${API}/quacks/${id}`)
    expect(response.status()).toBe(403)
  } finally {
    if (id) await author.request.delete(`${API}/quacks/${id}`)
    await author.close()
    await other.close()
  }
})

test("the API answers 401 signed out, 404 for an unknown quack and 204 for an admin", async ({
  browser,
  request,
}) => {
  const text = `Spam via API ${Date.now()}`
  const author = await browser.newPage()
  const admin = await browser.newPage()
  let id: string | undefined
  try {
    id = await postQuackAs(author, AUTHOR, text)

    // `request` carries no session.
    expect((await request.delete(`${API}/quacks/${id}`)).status()).toBe(401)

    await signIn(admin, ADMIN.email, ADMIN.password)
    expect((await admin.request.delete(`${API}/quacks/does-not-exist`)).status()).toBe(404)
    // The admin is not the author, and the server still lets them delete.
    expect((await admin.request.delete(`${API}/quacks/${id}`)).status()).toBe(204)
    id = undefined
  } finally {
    if (id) await author.request.delete(`${API}/quacks/${id}`)
    await author.close()
    await admin.close()
  }
})

test("Mine shows only my quacks", async ({ page }) => {
  await signIn(page, OTHER.email, OTHER.password)
  await page.goto("/quacks")

  await page.getByRole("tab", { name: "Mine" }).click()
  await expect(page).toHaveURL(/view=mine/)
  await expect(page.getByRole("article").first()).toBeVisible()
  await expect(page.getByRole("article").filter({ hasNotText: "@DeepDuckThoughts" })).toHaveCount(0)
})

test("admin can delete someone else's quack", async ({ browser }) => {
  const text = `Spam ${Date.now()}`
  const author = await browser.newPage()
  const admin = await browser.newPage()
  let id: string | undefined
  try {
    id = await postQuackAs(author, AUTHOR, text)

    await signIn(admin, ADMIN.email, ADMIN.password)
    await admin.goto("/quacks")

    const spam = admin.getByRole("article").filter({ hasText: text })
    await expect(spam).toBeVisible()
    await spam.getByRole("button", { name: "Delete quack" }).click()
    await admin.getByRole("dialog").getByRole("button", { name: "Delete" }).click()
    await expect(admin.getByRole("dialog")).toBeHidden()
    await expect(spam).toHaveCount(0)
    id = undefined
  } finally {
    if (id) await author.request.delete(`${API}/quacks/${id}`)
    await author.close()
    await admin.close()
  }
})
