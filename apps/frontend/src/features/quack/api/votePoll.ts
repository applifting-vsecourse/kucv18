import { api } from "@/lib/api-client"

import { pollSchema, type Poll } from "@/features/quack/api/quackSchemas"

export async function votePoll(input: { pollId: string; optionId: string }): Promise<Poll> {
  const json = await api
    .put(`polls/${input.pollId}/vote`, { json: { optionId: input.optionId } })
    .json()
  return pollSchema.parse(json)
}
