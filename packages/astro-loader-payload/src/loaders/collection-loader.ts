import type { CollectionSlug, PayloadTypesShape, TypeWithID } from "payload";
import type { 
    PayloadCollectionOptions,
    QueryOmitCollection
} from "../types";
import type { Loader } from "astro/loaders";
import {
    resolveLoaderName
} from '../internal/resolve-name'
import { PayloadLoaderError } from "../internal/error-utils";
import { PayloadErrors } from "../data/errors-data";
import { paginate, type PaginationMode } from "../internal/pagination";
import { DEFAULT_STREAM_PAGE_SIZE } from "../constants";

interface payloadOptions<
    T extends PayloadTypesShape,
    TSlug extends CollectionSlug<T>
> extends PayloadCollectionOptions<T, TSlug> {
    // Omit user providing the collection in the query, as payloadBaseOptions
    // has a collection field. I want to remove any ambiguity and make it simple
    query?: QueryOmitCollection<T>,
    pagination?: {
        mode?: PaginationMode
    }
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

            const mode: PaginationMode = options.pagination?.mode ?? "default"

            const processPage = async (docs: TypeWithID[]) => {
                for (const item of docs) {
                    const raw = item as unknown as Record<string, unknown>
                    
                    // Let the user define their own idField to use
                    const idKey = options.idField ?? 'id'
                    const rawId = raw[idKey] ?? item.id
                    const id = String(rawId)

                    // Warn user
                    // if (options.idField && raw[options.idField] == null) {
                    //     logger.warn(`idField "${options.idField}" missing on a doc; using id instead`)
                    // }

                    let data

                    try {
                        data = options.skipValidation
                            ? raw
                            : await parseData({ id, data: raw })
                    } catch (cause) {
                        throw PayloadLoaderError.from(
                            PayloadErrors.validationFailed,
                            [options.collection, id],
                            cause
                        )
                    }
                    store.set({ id, data })
                }
            }
            
            store.clear();

            try {
                await paginate(
                    mode,
                    // fetchPage: merge presets + user query + pagination args
                    (pageArgs) => options.adapter.find({

                        // Sensible presets
                        sort: 'createdAt',
                        draft: false,
                        limit: DEFAULT_STREAM_PAGE_SIZE,

                        // Overrides
                        ...options.query,
                        ...pageArgs,
                        collection: options.collection, 
                    }),
                    processPage,
                    options.query?.limit
                )
            } catch (cause) {
                if (PayloadLoaderError.is(cause)) throw cause
                
                throw PayloadLoaderError.from(
                    PayloadErrors.fetchFailed,
                    [options.collection],
                    cause
                )
            }

        },

    } satisfies Loader;
}