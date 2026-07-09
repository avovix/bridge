import { describe, expect, it } from "vitest";
import { payloadMockAdapter } from "../../src/adapters/payload-mock";
import { payloadLiveCollectionLoader } from "../../src";
import { PayloadLiveError } from "../../src/internal/error-utils";

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

            const [entry] = result.entries
            expect(entry?.id).toBe('1')
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

            const [entry] = result.entries
            expect(entry?.id).toBe('42')
        })

    })

    describe('loadEntry', () => {
        it('returns a single entry by id', async () => {

            const adapter = payloadMockAdapter({
                find: async () => ({
                    docs: [{ id: 1, slug: 'hello' }],
                    totalDocs: 1, limit: 1, totalPages: 1, page: 1, pagingCounter: 1,
                    hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
                }),
            })

            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts' })
            const result = await loader.loadEntry({ filter: { id: 1 }, collection: 'posts' })

            if (result && 'error' in result) throw result.error
            expect(result?.id).toBe('1')
            expect(result?.data).toEqual({ id: 1, slug: 'hello' })
        })

        it('returns undefined when the entry is not found', async () => {

            const adapter = payloadMockAdapter({
                find: async () => ({
                    docs: [ ],
                    totalDocs: 1, limit: 1, totalPages: 1, page: 1, pagingCounter: 1,
                    hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
                }),
            })

            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts' })
            const result = await loader.loadEntry({ filter: { id: 999 }, collection: 'posts' })

            expect(result).toBeUndefined()
        })

        it('returns nonUniqueIdField error when >1 docs match', async () => {
            const adapter = payloadMockAdapter({
                find: async () => ({
                    docs: [{ id: 1, slug: 'dup' }, { id: 2, slug: 'dup' }],
                    totalDocs: 1, limit: 1, totalPages: 1, page: 1, pagingCounter: 1,
                    hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
                }),
            })
            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts', idField: 'slug' })

            const result = await loader.loadEntry({ filter: { id: 'dup' }, collection: 'posts' })

            if (!result || !('error' in result)) {
                throw new Error('expected an error result')
            }

            expect('error' in result && PayloadLiveError.is(result.error)).toBe(true)
            expect((result as any).error.code).toBe('PAYLOAD_NON_UNIQUE_ID_FIELD')
        })

        it('returns entryFetchFailed error when the adapter throws', async () => {
            const adapter = payloadMockAdapter({
                find: async () => { throw new Error('network down') },
            })
            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts' })

            const result = await loader.loadEntry({ filter: { id: '1' }, collection: 'posts' })

            if (!result || !('error' in result)) {
                throw new Error('expected an error result')
            }

            expect('error' in result && PayloadLiveError.is(result.error)).toBe(true)
            expect((result as any).error.code).toBe('PAYLOAD_ENTRY_FETCH_FAILED')
        })

        it('handles non-Error throws from the adapter', async () => {
            const adapter = payloadMockAdapter({
                find: async () => { throw 'a string, not an Error' }, 
            })
            const loader = payloadLiveCollectionLoader({ adapter, collection: 'posts' })

            const result = await loader.loadEntry({ filter: { id: '1' }, collection: 'posts' })

            if (!result || !('error' in result)) throw new Error('expected error')
            if (!PayloadLiveError.is(result.error)) throw new Error('expected PayloadLiveError')

            expect(PayloadLiveError.is(result.error)).toBe(true)
            expect(result.error.code).toBe('PAYLOAD_ENTRY_FETCH_FAILED')
            // cause should be undefined because the thrown value wasn't an Error
            expect((result.error as any).cause).toBeUndefined()
        })

    })

})