import type { CollectionSlug, PayloadTypesShape } from "payload";
import type { payloadBaseOptions, QueryOmitCollection } from "../types";
import type { LiveLoader } from "astro/loaders";
import { resolveLoaderName } from "../internal/resolve-name";
import { PayloadLiveError } from "../internal/error-utils";
import { PayloadErrors } from "../data/errors-data";

// Use an alias for now until live needs separate fields
type payloadLiveOptions<
    T extends PayloadTypesShape, 
    TSlug extends CollectionSlug<T>
> = payloadBaseOptions<T, TSlug>

type EntryFilter = { id: string | number}

// Alias + allows us to adjust easily in the future + Readability
type PayloadFindQuery<T extends PayloadTypesShape> = QueryOmitCollection<T>;

// Live Loader uses 'filter' instead of 'query'
export function payloadLiveCollectionLoader<
    T extends PayloadTypesShape,
    TSlug extends CollectionSlug<T>
>(
    options: payloadLiveOptions<T, TSlug>
): LiveLoader<
    Record<string, unknown>, 
    EntryFilter, 
    PayloadFindQuery<T>, 
    PayloadLiveError
    >  {

    const name = resolveLoaderName(options.collection, options.loaderName);

    return {
        name: name,
        loadCollection: async ({filter}) => {

            let collection

            try {
                collection = await options.adapter.find({

                    // Sensible presets
                    sort: 'createdAt',
                    limit: 1000,

                    ...filter,
                    collection: options.collection, 
                });
            } catch (cause) {
                return {
                    error: PayloadLiveError.from(
                        options.collection,
                        PayloadErrors.fetchFailed,
                        [options.collection],
                        cause
                    )
                }
            }

            const idKey = options.idField ?? 'id'

            return {
                entries: collection.docs.map((item) => {
                    const raw = item as unknown as Record<string, unknown>
                    const id = String(raw[idKey] ?? item.id)

                    return { id, data: raw }
                })
            }
        },

        loadEntry: async ({filter}) => {
            // Let the user define their own idField to use
            const idKey = options.idField ?? 'id'

            let result 
            
            try {
                result = await options.adapter.find({
                    collection: options.collection,

                    where: {
                        [idKey]: {equals: filter.id}
                    },
                    limit: 2 // If there are more than 2 docs found, throw an error
                })
            } catch (cause) {
                return {
                    error: PayloadLiveError.from(
                        options.collection,
                        PayloadErrors.entryFetchFailed,
                        [options.collection, filter.id],
                        cause
                    )
                }
            }

            if (result.docs.length > 1) {
                return {
                    error: PayloadLiveError.from(
                        options.collection,
                        PayloadErrors.nonUniqueIdField,
                        [options.collection, idKey.toString()]
                    )
                }
            }

            const doc = result.docs[0]
            if (!doc) return undefined

            const raw = doc as unknown as Record<string, unknown>
            return { id: String(raw[idKey]), data: raw}
        },

    } satisfies LiveLoader<Record<string, unknown>, EntryFilter, PayloadFindQuery<T>, PayloadLiveError>
}