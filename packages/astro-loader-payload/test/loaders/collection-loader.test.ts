import { describe, expect, it } from "vitest";
import { payloadMockAdapter } from "../../src/adapters/payload-mock";
import { createLoaderContext } from "../_mocks/create-loader-context";
import { payloadCollectionLoader } from "../../src";

describe('payloadCollectionLoader', () => {
    it('stores each doc returned by the adapter', async () => {
        const adapter = payloadMockAdapter({
            find: async() => ({
                docs: [{id: 1}, {id: 2}],
                totalDocs: 2, limit: 1000, totalPages: 1, pages: 1, pagingCounter: 1,
                hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null
            })
        })

        const ctx = createLoaderContext()
        const loader = payloadCollectionLoader({adapter, collection: 'posts'})

        await loader.load(ctx)

        expect(ctx.store.set).toHaveBeenCalledTimes(2)
        expect(ctx.store.keys()).toEqual(["1", "2"])
    })

    it('keys entries by idField when provided', async() => {
        const adapter = payloadMockAdapter({
            find: async () => ({
                docs: [{id: 1, slug: 'hello'}],
                totalDocs: 1, limit: 1000, totalPages: 1, pages: 1, pagingCounter: 1,
                hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null
            })
        })

        const ctx = createLoaderContext()
        const loader = payloadCollectionLoader({adapter, collection: 'posts', idField: 'slug'})

        await loader.load(ctx)

        expect(ctx.store.keys()).toEqual(['hello'])
    })

    it('skips parseData when skipValidation is true', async() => {
        const adapter = payloadMockAdapter({
            find: async() => ({
                docs: [{ id: 1}],
                totalDocs: 1, limit: 1000, totalPages: 1, page: 1, pagingCounter: 1,
                hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null
            })
        })

        const ctx = createLoaderContext()
        const loader = payloadCollectionLoader({ adapter, collection: 'posts', skipValidation: true})

        await loader.load(ctx)

        expect(ctx.parseData).not.toHaveBeenCalled()
        expect(ctx.store.set).toHaveBeenCalledTimes(1)
    })

    it('falls back to the doc id when the idField is missing on a doc', async () => {
        const adapter = payloadMockAdapter({
            find: async () => ({
            docs: [{ id: 42 }], 
            totalDocs: 1, limit: 1000, totalPages: 1, page: 1, pagingCounter: 1,
            hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
            }),
        })

        const ctx = createLoaderContext()
        const loader = payloadCollectionLoader({
            adapter,
            collection: 'posts',
            idField: 'slug',
        })

        await loader.load(ctx)

        // fell back to item.id (42) since slug was missing
        expect(ctx.store.keys()).toEqual(['42'])
    })


})