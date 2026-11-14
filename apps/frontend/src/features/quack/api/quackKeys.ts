export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: () => [...quackKeys.all(), "list"] as const,
  threads: () => [...quackKeys.all(), "thread"] as const,
  thread: (id: string) => [...quackKeys.threads(), id] as const,
  list: (search: string, isMine = false) => [...quackKeys.lists(), { search, isMine }] as const,
}
