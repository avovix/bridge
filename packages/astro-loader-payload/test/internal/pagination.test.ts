import { describe, expect, it, vi } from 'vitest'
import { paginate } from '../../src/internal/pagination'
import type { PaginatedDocs, TypeWithID } from 'payload'

// helper: a fake fetchPage that returns N pages
function fakeFetcher(pages: any[]) {
  return vi.fn(async ({ page = 1 }) => pages[page - 1])
}

function page(docs: TypeWithID[], overrides: Partial<PaginatedDocs<TypeWithID>> = {}): PaginatedDocs<TypeWithID> {
  return {
    docs,
    totalDocs: docs.length,
    limit: 50,
    totalPages: 1,
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
    ...overrides,
  }
}

describe('paginate', () => {
  describe('single mode', () => {
    it('fetches once with pagination: false', async () => {
        const fetchPage = vi.fn(async () => page([{ id: 1 }, { id: 2 }]))
        const onPage = vi.fn()

        await paginate('single', fetchPage, onPage)

        expect(fetchPage).toHaveBeenCalledTimes(1)
        expect(fetchPage).toHaveBeenCalledWith({ pagination: false })
        expect(onPage).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]) 
    })
  })

  describe('stream mode', () => {
    it('traverses all pages, calling onPage per page', async () => {
        const fetchPage = fakeFetcher([
            { docs: [{ id: 1 }], hasNextPage: true, nextPage: 2 },
            { docs: [{ id: 2 }], hasNextPage: true, nextPage: 3 },
            { docs: [{ id: 3 }], hasNextPage: false, nextPage: null },
        ])
        const onPage = vi.fn()

        await paginate('stream', fetchPage, onPage, 50)

        expect(fetchPage).toHaveBeenCalledTimes(3)
        expect(onPage).toHaveBeenCalledTimes(3)
        expect(onPage).toHaveBeenNthCalledWith(1, [{ id: 1 }])
        expect(onPage).toHaveBeenNthCalledWith(3, [{ id: 3 }])
    })
  })

  describe('default mode', () => {
    it('stops after one page when there is no next page', async () => {
        const fetchPage = fakeFetcher([
            { docs: [{ id: 1 }], hasNextPage: false, nextPage: null },
        ])
        const onPage = vi.fn()

        await paginate('default', fetchPage, onPage)

        expect(fetchPage).toHaveBeenCalledTimes(1)
        expect(onPage).toHaveBeenCalledTimes(1)
    })

    it('streams the rest when there are more pages', async () => {
        const fetchPage = fakeFetcher([
            { docs: [{ id: 1 }], hasNextPage: true, nextPage: 2 },
            { docs: [{ id: 2 }], hasNextPage: false, nextPage: null },
        ])
        const onPage = vi.fn()

        await paginate('default', fetchPage, onPage)

        expect(fetchPage).toHaveBeenCalledTimes(2)
        expect(onPage).toHaveBeenCalledTimes(2)
    })

    it('defaults to page 2 when nextPage is not provided (large collection)', async () => {
        const fetchPage = fakeFetcher([
            page([{ id: 1 }], { totalDocs: 5000, hasNextPage: true, nextPage: null }),
            page([{ id: 2 }], { totalDocs: 5000, hasNextPage: false, nextPage: null }),
        ])
        const onPage = vi.fn()

        await paginate('default', fetchPage, onPage, 50)

        expect(fetchPage).toHaveBeenCalledTimes(2)
        expect(fetchPage).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2 }))
    })

  })
})
