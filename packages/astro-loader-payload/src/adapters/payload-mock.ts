import type { PaginatedDocs, PayloadTypesShape, TypeWithID } from "payload";
import type { PayloadBaseAdapter } from "./adapter-base";


const defaultPaginatedDocs: PaginatedDocs<TypeWithID> = {
  docs: [],
  totalDocs: 0,
  limit: 0,
  totalPages: 1,
  page: 1,
  pagingCounter: 1,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
}

export function payloadMockAdapter<T extends PayloadTypesShape>(
  impl: Partial<PayloadBaseAdapter<T>>,
): PayloadBaseAdapter<T> {
  return {
    find: impl.find ?? (async () => defaultPaginatedDocs),
    findByID: impl.findByID ?? (async () => null),
  }
}
