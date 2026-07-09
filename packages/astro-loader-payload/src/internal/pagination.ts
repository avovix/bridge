import type { PaginatedDocs, TypeWithID } from "payload";
import { DEFAULT_ADAPTIVE_THRESHOLD, DEFAULT_STREAM_PAGE_SIZE } from "../constants";

export type PaginationMode = "default" | "single" | "stream"

// Fetches one page of hte collection
export type PageFetcher = (args: { limit?: number; page?: number; pagination?: boolean})
    => Promise<PaginatedDocs<TypeWithID>>

// Called on each page of docs as it arrives
export type OnPage = (docs: TypeWithID[]) => Promise<void> | void

// Fetch all docs in one call
async function fetchSingle(fetchPage: PageFetcher, onPage: OnPage): Promise<void> {
    const result = await fetchPage({pagination: false})
    await onPage(result.docs)
}

// Traverse page by page, processing each page then discarding it (memory-safe)
async function fetchStream(
    fetchPage: PageFetcher, 
    onPage: OnPage, 
    pageSize: number
): Promise<void> {

    let page = 1
    let result: PaginatedDocs<TypeWithID>

    do {
        result = await fetchPage({ limit: pageSize, page })
        await onPage(result.docs)
        page = result.nextPage ?? 0
    } while (result.hasNextPage)
}

export async function fetchAdaptive(
    fetchPage: PageFetcher,
    onPage: OnPage,
    pageSize: number
): Promise<void> {
    const first = await fetchPage({ limit: pageSize, page: 1 })

    // threshold / sensible preset
    if (first.totalDocs <= DEFAULT_ADAPTIVE_THRESHOLD) {
        // small: fetch everything in one call, don't reuse page 1
        const all = await fetchPage({ pagination: false })
        await onPage(all.docs)
        return
    }

    // large: page 1 already fetched — process it, then stream the rest
    await onPage(first.docs)

    if (!first.hasNextPage) return

    let page = first.nextPage ?? 2
    let result = first
    while (result.hasNextPage) {
        result = await fetchPage({ limit: pageSize, page })
        await onPage(result.docs)
        page = result.nextPage ?? 0
    }
}


export async function paginate(
    mode: PaginationMode,
    fetchPage: PageFetcher,
    onPage: OnPage,
    pageSize: number = DEFAULT_STREAM_PAGE_SIZE
): Promise<void> {
    if (mode === "single") return fetchSingle(fetchPage, onPage)
    if (mode === "stream") return fetchStream(fetchPage, onPage, pageSize)
    
    return fetchAdaptive(fetchPage, onPage, pageSize)
}