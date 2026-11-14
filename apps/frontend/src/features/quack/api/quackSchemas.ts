import { z } from "zod"

import { MOODS } from "@/lib/moods"

// Per the Applifting frontend playbook: validate every server payload with zod
// and infer types from the schema rather than auto-generating them.
export const quackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
})

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  votes: z.number().int().nonnegative(),
})

export const pollSchema = z.object({
  id: z.string(),
  options: z.array(pollOptionSchema),
  totalVotes: z.number().int().nonnegative(),
  // The option the signed-in user picked; other people's votes are never sent.
  myVoteOptionId: z.string().nullable(),
})

// A deleted quack that is kept only because it has replies (docs/adr/0001)
// carries no content, author or date: text, userId, createdAt and user are null.
export const quackSchema = z.object({
  id: z.string(),
  text: z.string().nullable(),
  // Optional on the server; a quack without one comes back as null.
  mood: z.enum(MOODS).nullable(),
  userId: z.string().nullable(),
  // The quack this one replies to; null for a top-level quack.
  parentId: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
  user: quackUserSchema.nullable(),
  // Null for a plain quack.
  poll: pollSchema.nullable(),
  // Counted by the server on every read.
  replyCount: z.number().int().nonnegative(),
  isDeleted: z.boolean(),
})

// GET /quacks/:id: the quack (or its tombstone) with its replies, oldest first.
export const quackThreadSchema = quackSchema.extend({
  replies: z.array(quackSchema),
})

export const quacksSchema = z.array(quackSchema)

export type PollOption = z.infer<typeof pollOptionSchema>
export type Poll = z.infer<typeof pollSchema>
export type Quack = z.infer<typeof quackSchema>
export type QuackThread = z.infer<typeof quackThreadSchema>
