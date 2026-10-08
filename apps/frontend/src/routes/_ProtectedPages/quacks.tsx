import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { Seo } from "@/components/Seo"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch, SEARCH_MAX_LENGTH } from "@/features/quack/components/QuackSearch"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  validateSearch: z.object({
    q: z.string().trim().max(SEARCH_MAX_LENGTH).optional().catch(undefined),
  }),
  component: QuacksPage,
})

function QuacksPage() {
  // The search term lives in the URL (?q=) so it survives reload and can be shared.
  const search = Route.useSearch().q ?? ""
  const navigate = useNavigate({ from: Route.fullPath })
  const quacksQuery = useQuery(quacksQueryOptions(search))

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm className="mb-4" />

        <QuackSearch
          value={search}
          onSearch={(q) => void navigate({ search: { q: q || undefined }, replace: true })}
          className="mb-6"
        />

        <QuackList
          search={search}
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
