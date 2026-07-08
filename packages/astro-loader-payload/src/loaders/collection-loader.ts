import type { CollectionSlug, PayloadTypesShape } from "payload";
import type { 
    payloadBaseOptions,
    QueryOmitCollection
} from "../types";
import type { Loader } from "astro/loaders";
import {
    resolveLoaderName
} from '../internal/resolve-name'

interface payloadOptions<
    T extends PayloadTypesShape,
    TSlug extends CollectionSlug<T>
> extends payloadBaseOptions<T, TSlug> {
    // Omit user providing the collection in the query, as payloadBaseOptions
    // has a collection field. I want to remove any ambiguity and make it simple
    query?: QueryOmitCollection<T>
}

export function payloadCollectionLoader<
    T extends PayloadTypesShape,
    TSlug extends CollectionSlug<T>>(
    options: payloadOptions<T, TSlug>
) {
    const name = resolveLoaderName(options.collection, options.loaderName);

    return {
        name: name,
        load: async({ store, parseData}) => {

            const collection = await options.adapter.find({
                // Sensible presets
                sort: 'createdAt',
                draft: false,
                limit: 1000,

                // Overrides
                ...options.query,
                collection: options.collection, 
            }) ;

            store.clear();

            for (const item of collection.docs) {
                const raw = item as unknown as Record<string, unknown>
                
                // Let the user define their own idField to use
                const idKey = options.idField ?? 'id'
                const rawId = raw[idKey] ?? item.id
                const id = String(rawId)

                // Warn user
                // if (options.idField && raw[options.idField] == null) {
                //     logger.warn(`idField "${options.idField}" missing on a doc; using id instead`)
                // }

                const data = options.skipValidation
                    ? raw
                    : await parseData({ id, data: raw })

                store.set({ id, data })
            }

        },

    } satisfies Loader;
}