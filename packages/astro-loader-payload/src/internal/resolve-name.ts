

export function resolveLoaderName(
    collectionSlug: string, 
    loaderName?: string | null 
): string {
    return loaderName === null
        ? 'payload-loader'
        : loaderName ?? `payload-loader:${collectionSlug}`
}