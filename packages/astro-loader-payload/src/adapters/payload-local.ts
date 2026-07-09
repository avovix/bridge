import type { Payload } from "payload";
import type { PaginatedDocs, PayloadTypesShape, TypeWithID } from "payload";
import type { PayloadBaseAdapter } from "./adapter-base";

export function payloadLocalAdapter<T extends PayloadTypesShape>(
    payload: Payload
 ): PayloadBaseAdapter<T> {
    return {
        find: (args) => {
            return payload.find(args as Parameters<typeof payload.find>[0]) as Promise<PaginatedDocs<TypeWithID>>
        },
    }
}
