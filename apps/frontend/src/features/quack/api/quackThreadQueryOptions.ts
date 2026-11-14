import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quackThreadSchema } from "@/features/quack/api/quackSchemas"

export const quackThreadQueryOptions = (id: string) =>
  queryOptions({
    queryKey: quackKeys.thread(id),
    queryFn: async () => quackThreadSchema.parse(await api.get(`quacks/${id}`).json()),
  })
