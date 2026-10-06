export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: () => [...quackKeys.all(), "list"] as const,
  list: (search: string | undefined) => [...quackKeys.lists(), { search }] as const,
}
