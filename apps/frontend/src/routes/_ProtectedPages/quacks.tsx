import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { Seo } from "@/components/Seo"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch, SEARCH_MAX_LENGTH } from "@/features/quack/components/QuackSearch"

const searchParamsSchema = z.object({
  q: z.string().trim().max(SEARCH_MAX_LENGTH).optional().catch(undefined),
})

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  validateSearch: searchParamsSchema,
  component: QuacksPage,
})

function QuacksPage() {
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const search = q === "" ? undefined : q
  const quacksQuery = useQuery(quacksQueryOptions(search))

  const setSearch = (term: string) =>
    void navigate({ search: { q: term === "" ? undefined : term } })

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm className="mb-4" />

        <QuackSearch
          className="mb-6"
          value={search ?? ""}
          onChange={setSearch}
        />

        <QuackList
          search={search}
          onClearSearch={() => setSearch("")}
          quacks={quacksQuery.data ?? []}
          isLoading={quacksQuery.isLoading}
          error={quacksQuery.error ?? undefined}
          // Only the error state offers a retry — posting invalidates the list,
          // and refocusing the tab refetches it.
          onReload={() => void quacksQuery.refetch()}
        />
      </section>
    </>
  )
}
