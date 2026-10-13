import { api } from "@/lib/api-client"
import type { Mood } from "@/lib/moods"

export type ProfileInput = {
  username: string
  name: string
  // An empty bio and a null mood clear the field.
  bio: string
  defaultMood: Mood | null
}

export async function updateProfile(input: ProfileInput): Promise<void> {
  await api.patch("me", { json: input })
}
