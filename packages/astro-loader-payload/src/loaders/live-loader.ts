import type { CollectionSlug, PayloadTypesShape } from "payload";
import type { payloadBaseOptions, QueryOmitCollection } from "../types";
import type { LiveLoader } from "astro/loaders";

// Use an alias for now until live needs separate fields
type payloadLiveOptions<
    T extends PayloadTypesShape, 
    TSlug extends CollectionSlug<T>
> = payloadBaseOptions<T, TSlug>

type EntryFilter = { id: string | number}

// Live Loader uses 'filter' instead of 'query'
export function payloadLiveCollectionLoader<
    T extends PayloadTypesShape,
    TSlug extends CollectionSlug<T>
>(
    options: payloadLiveOptions<T, TSlug>
): LiveLoader<Record<string, unknown>, EntryFilter, QueryOmitCollection<T>>  {

    const name =
        options.loaderName === null
            ? 'payload-loader'
            : options.loaderName ?? `payload-loader:${options.collectionSlug}`

    return {
        name: name,
        loadCollection: async ({filter}) => {
            const collection = await options.adapter.find({

                 // Sensible presets
                sort: 'createdAt',
                limit: 1000,

                ...filter,
                collection: options.collectionSlug, 
            });

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
            // const idKey = options.idField ?? 'id'
            // const rawId = raw[idKey] ?? item.id
            // const id = String(rawId)

            const entry = await options.adapter.findByID({
                ...filter,
                collection: options.collectionSlug,
            })

            return entry ? { id: entry.id.toString(), data: entry as unknown as Record<string, unknown> } : undefined
        },

    } satisfies LiveLoader<Record<string, unknown>, EntryFilter, QueryOmitCollection<T>>
}