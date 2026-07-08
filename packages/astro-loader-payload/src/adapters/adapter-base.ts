import type { 
    CollectionSlug, 
    FindOptions, 
    PaginatedDocs,
    PayloadTypesShape,
    TypeWithID, 
    // FindByIDOptions
} from "payload"


export interface PayloadBaseAdapter<T extends PayloadTypesShape> {

    find(
        args: FindOptions<CollectionSlug<T>, never>
    ): Promise<PaginatedDocs<TypeWithID>>

    findByID(args: {
        collection: CollectionSlug<T>
        id: string | number
        depth?: number
    }): Promise<TypeWithID | null>

    // todo: open payloadcms to export findByID - possibility an oversight?
    // lines 72-80 don't re-export the types
    // export type { FindOptions }
    // import {
    // findByIDLocal,
    // type Options as FindByIDOptions,
    // } from './collections/operations/local/findByID.js'
    // import {
    // findDistinct as findDistinctLocal,
    // type Options as FindDistinctOptions,
    // } from './collections/operations/local/findDistinct.js'
    //findByID(args: FindByIDOptions<TSlug, false, never>): Promise<Document | null>

}