import type { PayloadSDK } from "@payloadcms/sdk";
import type { PaginatedDocs, PayloadTypesShape, TypeWithID } from "payload";
import type { PayloadBaseAdapter } from "./adapter-base";

export function payloadSdkAdapter<T extends PayloadTypesShape>(
    sdk: PayloadSDK<T>
 ): PayloadBaseAdapter<T> {
    return {
        find: (args) => {
            return sdk.find(args as Parameters<typeof sdk.find>[0]) as Promise<PaginatedDocs<TypeWithID>>
        },

        findByID: async (args) => {
            const doc = await sdk.findByID({
                collection: args.collection,
                id: args.id,
                depth: args.depth,
                disableErrors: true,
            } as Parameters<typeof sdk.findByID>[0])
            return (doc ?? null) as TypeWithID | null
        }
    }
}
