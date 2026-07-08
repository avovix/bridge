
import type { LoaderContext } from 'astro/loaders'
import { vi } from 'vitest'
import { LoggerMock } from './logger.mock'
import { createDataStore } from './store.mock'


export function createLoaderContext(
    overrides?: Partial<LoaderContext>,
): LoaderContext {
    return {
        collection: 'posts',
        store: createDataStore(),
        meta: new Map<string, string>(),
        logger: new LoggerMock(),
        parseData: vi.fn(async ({data}) => data),
        generateDigest: vi.fn(() => 'digest'),
        config: {} as any,
        renderMarkdown: vi.fn(),
        ...overrides
    } satisfies Partial<LoaderContext> as unknown as LoaderContext
}