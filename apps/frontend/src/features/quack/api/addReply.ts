import { api } from "@/lib/api-client"
import type { Mood } from "@/lib/moods"

import { quackSchema, type Quack } from "@/features/quack/api/quackSchemas"

export async function addReply(input: {
  quackId: string
  text: string
  mood?: Mood
}): Promise<Quack> {
  const { quackId, ...body } = input
  const json = await api.post(`quacks/${quackId}/replies`, { json: body }).json()
  return quackSchema.parse(json)
}
