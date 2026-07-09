import { describe, expect, it, vi } from "vitest";
import { payloadMockAdapter } from "../../src/adapters/payload-mock";
import { createLoaderContext } from "../_mocks/create-loader-context";
import { payloadCollectionLoader, PayloadLoaderError } from "../../src";

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

    it('returns entryFailed error when the adapter throws', async () => {
        const cause = new Error('network down')
        const adapter = payloadMockAdapter({
            find: async () => { throw new Error('network down') },
        })

        const ctx = createLoaderContext()
        const loader = payloadCollectionLoader({ adapter, collection: 'posts' })

        let caught: unknown
        await loader.load(ctx).catch((e) => { caught = e })

        expect(PayloadLoaderError.is(caught)).toBe(true)
        expect((caught as PayloadLoaderError).code).toBe('PAYLOAD_FETCH_FAILED')
        expect((caught as PayloadLoaderError).cause).toStrictEqual(cause)


    })

    it('throws PayloadValidationError when parseData fails', async () => {
        const cause = new Error('schema mismatch')
        const adapter = payloadMockAdapter({
            find: async () => ({
                docs: [{ id: 1 }],   // one doc to process
                totalDocs: 1, limit: 1000, totalPages: 1, page: 1, pagingCounter: 1,
                hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
            }),
        })

        const ctx = createLoaderContext({
            parseData: vi.fn().mockRejectedValue(cause),
        })

        const loader = payloadCollectionLoader({ adapter, collection: 'posts' })

        let caught: unknown
        await loader.load(ctx).catch((e) => { caught = e })

        expect(PayloadLoaderError.is(caught)).toBe(true)
        expect((caught as PayloadLoaderError).code).toBe('PAYLOAD_VALIDATION_FAILED')
        expect((caught as PayloadLoaderError).cause).toBe(cause)
    })

    it('does not call parseData when skipValidation is true', async () => {
        const adapter = payloadMockAdapter({
            find: async () => ({
                docs: [{ id: 1 }],
                totalDocs: 1, limit: 1000, totalPages: 1, page: 1, pagingCounter: 1,
                hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null,
            }),
        })
        const ctx = createLoaderContext({ parseData: vi.fn().mockRejectedValue(new Error('should not run')) })
        const loader = payloadCollectionLoader({ adapter, collection: 'posts', skipValidation: true })

        await loader.load(ctx)   // should NOT throw (parseData skipped)

        expect(ctx.parseData).not.toHaveBeenCalled()
    })

})