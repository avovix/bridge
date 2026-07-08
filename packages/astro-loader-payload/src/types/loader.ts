import type { CollectionSlug, DataFromCollectionSlug, PayloadTypesShape } from "payload"
import type { PayloadBaseAdapter } from "../adapters/adapter-base"

export interface payloadBaseOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>
  > {
    adapter: PayloadBaseAdapter<T>
    collection: TSlug,

    // Optional options
    skipValidation?: boolean
    loaderName?: string | null // defaults to collectionSlug, use null to disable and use string to customize/override
    idField?: keyof DataFromCollectionSlug<TSlug> // useful for getEntry('posts', slug)

    // idField?: Field | null
    // idField?: keyof DataFromCollectionSlug<CollectionSlug<T>>
    // fetchAll?: boolean // same as traversal?
    // pageSize?: number // // per-page size when traversing
    // paginationTraversal?: boolean
    // incrementSync?: number | null
    // staleRemoval?: boolean // will remove later
    // deletionStrategy?: 'full' | 'trash' | 'reconcile' | 'none'
    // onError?: 'throw' | 'warn' | ((err) => void) // error handling
    // retries?: number  // opt in retry count for transient failures
    // transform?: (doc) => Record<string, unknown> // let users reshape docs before store.set (e.g. flatten, rename, resolve URLs)
    // rendered?: (doc) => { html: string } // provide rendered HTML (e.g. from richText) so pages can use render(entry)
    // global collections?
    // 
}

export type QueryOmitCollection<T extends PayloadTypesShape> =
  Omit<Parameters<PayloadBaseAdapter<T>['find']>[0], 'collection'>
  