import { describe, expect, it } from "vitest";
import { payloadMockAdapter } from "../../src/adapters/payload-mock";
import { payloadLiveCollectionLoader } from "../../src";

describe("payloadLiveCollectionLoader", () => {
    describe("loadCollection", () => {
        it('stores each doc returned by the adapter', async () => {
            const adapter = payloadMockAdapter({
                find: async () => ({
                    docs: [{ id: 1, slug: 'a' }],
                    totalDocs: 1, limit: 1000, totalPages: 1, page: 1, pagingCounter: 1,
                    hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
                }),
            })


            const loader = payloadLiveCollectionLoader({adapter, collection: 'posts'})
            const result = await loader.loadCollection({ filter: {}, collection: 'posts' })

            if ('error' in result) throw result.error
            expect(result.entries).toHaveLength(1)
            expect(result.entries[0].id).toBe('1')
        })

        it('keys entries by idField when provided', async() => {
            const adapter = payloadMockAdapter({
                find: async () => ({
                    docs: [{id: 1, slug: 'hello'}],
                    totalDocs: 1, limit: 1000, totalPages: 1, pages: 1, pagingCounter: 1,
                    hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null
                })
            })

            const loader = payloadLiveCollectionLoader({adapter, collection: 'posts', idField: 'slug'})
            const result = await loader.loadCollection({ filter: {}, collection: 'posts' })

            if ('error' in result) throw result.error
            expect([...result.entries].map(e => e.id)).toEqual(['hello'])
        })

        it('falls back to the doc id when idField is missing', async () => {
            const adapter = payloadMockAdapter({
                find: async () => ({
                docs: [{ id: 42 }],   // no slug
                totalDocs: 1, limit: 1000, totalPages: 1, page: 1, pagingCounter: 1,
                hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
                }),
            })

            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts', idField: 'slug' })
            const result = await loader.loadCollection({ filter: {}, collection: 'posts' })

            if ('error' in result) throw result.error
            expect(result.entries[0].id).toBe('42')   // fell back to id
        })

    })

    describe('loadEntry', () => {
        it('returns a single entry by id', async () => {
            const adapter = payloadMockAdapter({
            findByID: async () => ({ id: 1, slug: 'hello' }),
            })

            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts' })
            const result = await loader.loadEntry({ filter: { id: 1 }, collection: 'posts' })

            if (result && 'error' in result) throw result.error
            expect(result?.id).toBe('1')
            expect(result?.data).toEqual({ id: 1, slug: 'hello' })
        })

        it('returns undefined when the entry is not found', async () => {
            const adapter = payloadMockAdapter({
            findByID: async () => null,
            })

            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts' })
            const result = await loader.loadEntry({ filter: { id: 999 }, collection: 'posts' })

            expect(result).toBeUndefined()
        })
    })

    
})