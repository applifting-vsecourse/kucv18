import { api } from "@/lib/api-client"

import { quackSchema, type Quack } from "@/features/quack/api/quackSchemas"
import type { Mood } from "@/features/quack/moods"

export async function addQuack(input: { text: string; mood?: Mood }): Promise<Quack> {
  const json = await api.post("quacks", { json: input }).json()
  return quackSchema.parse(json)
}
