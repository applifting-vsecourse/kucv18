// Mirrors the Mood enum on the server. Keep the order: it is the order the
// picker lists them in.
export const MOODS = ["happy", "sad", "angry", "silly"] as const

export type Mood = (typeof MOODS)[number]

export const MOOD_LABELS: Record<Mood, string> = {
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  silly: "Silly",
}
