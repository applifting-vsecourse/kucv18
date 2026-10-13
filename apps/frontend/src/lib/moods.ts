// Mirrors the Mood enum on the server. Keep the order: it is the order the
// picker lists them in.
export const MOODS = ["happy", "sad", "angry", "silly"] as const

// Radix Select can't hold an empty value, so "no mood" gets a sentinel that the
// forms map to "leave it out" (or null) when they talk to the server.
export const NO_MOOD = "none"

export type Mood = (typeof MOODS)[number]

export const MOOD_LABELS: Record<Mood, string> = {
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  silly: "Silly",
}
