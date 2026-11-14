import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

import { ADMIN, API, AUTHOR, OTHER } from "./accounts"
import { signIn } from "./signIn"

// docs/adr/0001: a quack with replies becomes an empty tombstone, one without
// replies is really deleted. These tests call the API directly, so they fail
// when the server rule is switched off, whatever the UI does.

type Thread = {
  id: string
  text: string | null
  mood: string | null
  userId: string | null
  createdAt: string | null
  user: unknown
  poll: unknown
  isDeleted: boolean
  replyCount: number
  replies: { id: string; text: string | null }[]
}

async function signedIn(
  page: Page,
  account: { email: string; password: string },
): Promise<APIRequestContext> {
  await signIn(page, account.email, account.password)
  return page.request
}

async function post(api: APIRequestContext, text: string, extra: object = {}): Promise<string> {
  const response = await api.post(`${API}/quacks`, { data: { text, ...extra } })
  expect(response.status()).toBe(201)
  return ((await response.json()) as { id: string }).id
}

async function reply(api: APIRequestContext, quackId: string, text: string): Promise<string> {
  const response = await api.post(`${API}/quacks/${quackId}/replies`, { data: { text } })
  expect(response.status()).toBe(201)
  return ((await response.json()) as { id: string }).id
}

const thread = async (api: APIRequestContext, id: string): Promise<Thread> =>
  (await api.get(`${API}/quacks/${id}`)).json() as Promise<Thread>

const feedTexts = async (api: APIRequestContext, query = ""): Promise<string[]> => {
  const quacks = (await (await api.get(`${API}/quacks${query}`)).json()) as {
    text: string | null
  }[]
  return quacks.map((quack) => quack.text ?? "")
}

test.describe("replies", () => {
  // One author, one replier and an admin, each with their own page.
  let author: APIRequestContext
  let other: APIRequestContext
  let admin: APIRequestContext
  const created: string[] = []

  test.beforeEach(async ({ browser }) => {
    author = await signedIn(await browser.newPage(), AUTHOR)
    other = await signedIn(await browser.newPage(), OTHER)
    admin = await signedIn(await browser.newPage(), ADMIN)
  })

  test.afterEach(async () => {
    // Replies first: the database refuses to delete a quack that has replies.
    for (const id of created.splice(0).reverse()) await admin.delete(`${API}/quacks/${id}`)
  })

  test("a reply shows under its quack and in the count, not in the feed", async () => {
    const tag = Date.now()
    const parent = await post(author, `Question ${tag}`)
    created.push(parent)
    const replyText = `Answer ${tag}`
    created.push(await reply(other, parent, replyText))

    const view = await thread(author, parent)
    expect(view.replyCount).toBe(1)
    expect(view.replies.map((item) => item.text)).toEqual([replyText])
    // Top-level only in the feed ...
    expect(await feedTexts(author)).not.toContain(replyText)
    // ... but the search finds the reply.
    expect(await feedTexts(author, `?q=${encodeURIComponent(replyText)}`)).toContain(replyText)
  })

  test("a reply to a reply is a 400, a poll on a reply is a 400, a missing quack is a 404", async () => {
    const parent = await post(author, `Depth ${Date.now()}`)
    created.push(parent)
    const first = await reply(other, parent, "first level")
    created.push(first)

    expect(
      (await other.post(`${API}/quacks/${first}/replies`, { data: { text: "nested" } })).status(),
    ).toBe(400)
    expect(
      (
        await other.post(`${API}/quacks/${parent}/replies`, {
          data: { text: "poll", poll: { options: ["a", "b"] } },
        })
      ).status(),
    ).toBe(400)
    expect((await other.post(`${API}/quacks/nope/replies`, { data: { text: "x" } })).status()).toBe(
      404,
    )
  })

  test("signed out, replying is a 401", async ({ request }) => {
    const parent = await post(author, `Signed out ${Date.now()}`)
    created.push(parent)
    expect(
      (await request.post(`${API}/quacks/${parent}/replies`, { data: { text: "x" } })).status(),
    ).toBe(401)
  })

  test("deleting a quack without replies removes it for good", async () => {
    const parent = await post(author, `No replies ${Date.now()}`)

    expect((await author.delete(`${API}/quacks/${parent}`)).status()).toBe(204)
    expect((await author.get(`${API}/quacks/${parent}`)).status()).toBe(404)
  })

  test("deleting a quack with replies keeps the replies and wipes the content", async () => {
    const tag = Date.now()
    const secret = `Secret ${tag}`
    const parent = await post(author, secret, {
      mood: "angry",
      poll: { options: ["yes", "no"] },
    })
    created.push(parent)
    const keep = await reply(other, parent, `Stays ${tag}`)
    created.push(keep)

    expect((await author.delete(`${API}/quacks/${parent}`)).status()).toBe(204)

    const view = await thread(other, parent)
    // The replies survive ...
    expect(view.replies.map((item) => item.text)).toEqual([`Stays ${tag}`])
    expect(view.replyCount).toBe(1)
    // ... and the deleted quack exposes nothing at all.
    expect(view).toMatchObject({
      isDeleted: true,
      text: null,
      mood: null,
      userId: null,
      createdAt: null,
      user: null,
      poll: null,
    })
    expect(JSON.stringify(view)).not.toContain(secret)
    // It is in the feed so the replies stay reachable, but not its text, and
    // not in the author's "Mine", and the search finds nothing.
    expect(await feedTexts(other)).not.toContain(secret)
    expect(
      (await (await other.get(`${API}/quacks`)).json()).some(
        (q: { id: string }) => q.id === parent,
      ),
    ).toBe(true)
    expect(
      (await (await author.get(`${API}/quacks?mine=true`)).json()).some(
        (q: { id: string }) => q.id === parent,
      ),
    ).toBe(false)
    expect(await feedTexts(other, `?q=${encodeURIComponent(secret)}`)).toEqual([])
    // Not even the author's name finds the tombstone.
    const byAuthor = (await (
      await other.get(`${API}/quacks?q=${encodeURIComponent("Caffeinated")}`)
    ).json()) as { id: string }[]
    expect(byAuthor.some((q) => q.id === parent)).toBe(false)
  })

  test("a deleted quack takes no new replies (409) and cannot be deleted again (404)", async () => {
    const parent = await post(author, `Closed ${Date.now()}`)
    created.push(parent)
    created.push(await reply(other, parent, "before"))
    expect((await author.delete(`${API}/quacks/${parent}`)).status()).toBe(204)

    expect(
      (await other.post(`${API}/quacks/${parent}/replies`, { data: { text: "after" } })).status(),
    ).toBe(409)
    expect((await author.delete(`${API}/quacks/${parent}`)).status()).toBe(404)
    expect((await admin.delete(`${API}/quacks/${parent}`)).status()).toBe(404)
  })

  test("deleting the last reply of a deleted quack removes it too", async () => {
    const parent = await post(author, `Last reply ${Date.now()}`)
    const first = await reply(other, parent, "one")
    const second = await reply(author, parent, "two")
    expect((await author.delete(`${API}/quacks/${parent}`)).status()).toBe(204)

    expect((await other.delete(`${API}/quacks/${first}`)).status()).toBe(204)
    // One reply left, so the tombstone stays.
    expect((await thread(author, parent)).isDeleted).toBe(true)

    expect((await author.delete(`${API}/quacks/${second}`)).status()).toBe(204)
    // Last reply gone: nothing depends on the tombstone any more.
    expect((await author.get(`${API}/quacks/${parent}`)).status()).toBe(404)
  })

  test("nobody but the author or an admin can delete a reply", async () => {
    const parent = await post(author, `Perms ${Date.now()}`)
    created.push(parent)
    const mine = await reply(other, parent, "mine")
    created.push(mine)

    expect((await author.delete(`${API}/quacks/${mine}`)).status()).toBe(403)
    expect((await other.delete(`${API}/quacks/${mine}`)).status()).toBe(204)
    created.pop()
  })
})
