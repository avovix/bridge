import type { CollectionSlug, DataFromCollectionSlug, PayloadTypesShape } from "payload"
import type { PayloadBaseAdapter } from "../adapters/adapter-base"
// import type { PaginationMode } from "../internal/pagination"

export interface PayloadBaseOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>
  > {
    adapter: PayloadBaseAdapter<T>
    collection: TSlug,

    // Optional options
    skipValidation?: boolean
    loaderName?: string | null // defaults to collectionSlug, use null to disable and use string to customize/override
    idField?: keyof DataFromCollectionSlug<TSlug> // useful for getEntry('posts', slug)
}

export interface PayloadCollectionOptions<
    T extends PayloadTypesShape,
    TSlug extends CollectionSlug<T>
  > extends PayloadBaseOptions<T, TSlug> {

}

// Often used when query field is exposed. Base options exposes collection field.
// As its hoisted up, we don't want to provide two options for collection field.
// Belt and suspenders..?
export type QueryOmitCollection<T extends PayloadTypesShape> =
  Omit<Parameters<PayloadBaseAdapter<T>['find']>[0], 'collection'>
  