import { describe, expect, it } from 'vitest'
import { payloadMockAdapter } from '../../src/adapters/payload-mock'

describe('payloadMockAdapter', () => {
  describe('find', () => {
    it('uses impl.find when provided', async () => {
      const paginated = {
        docs: [{ id: 1 }],
        totalDocs: 1, limit: 10, totalPages: 1, page: 1, pagingCounter: 1,
        hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
      }
      const adapter = payloadMockAdapter({
        find: async () => paginated,
      })

      const result = await adapter.find({ collection: 'posts' } as any)

      expect(result).toBe(paginated)
    })

    it('falls back to empty paginated docs when impl.find is omitted', async () => {
      const adapter = payloadMockAdapter({})

      const result = await adapter.find({ collection: 'posts' } as any)

      expect(result.docs).toEqual([])
      expect(result.totalDocs).toBe(0)
      expect(result.hasNextPage).toBe(false)
    })
  })

  describe('findByID', () => {
    it('uses impl.findByID when provided', async () => {
      const doc = { id: 1, slug: 'hello' }
      const adapter = payloadMockAdapter({
        findByID: async () => doc,
      })

      const result = await adapter.findByID({ collection: 'posts', id: 1 } as any)

      expect(result).toBe(doc)
    })

    it('falls back to null when impl.findByID is omitted', async () => {
      const adapter = payloadMockAdapter({})

      const result = await adapter.findByID({ collection: 'posts', id: 999 } as any)

      expect(result).toBeNull()
    })
  })
})
