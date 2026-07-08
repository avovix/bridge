import type { DataStore } from "astro/loaders";
import { vi } from "vitest";

export function createDataStore(): DataStore {
    type StoreEntry = ReturnType<DataStore["values"]>[number];
    const store = new Map<string, StoreEntry>();

    return {
        get: vi.fn((key: string) => {
            return store.get(key);
        }) as unknown as DataStore["get"],
        entries: vi.fn<DataStore["entries"]>(() => [...store.entries()]),
        set: vi.fn<DataStore["set"]>((entry => { store.set(entry.id, entry); return true })),
        values: vi.fn<DataStore["values"]>(() => [...store.values()]),
        keys: vi.fn<DataStore["keys"]>(() => [...store.keys()]),
        delete: vi.fn<DataStore["delete"]>((id) => store.delete(id)),
        clear: vi.fn<DataStore["clear"]>(() => store.clear()),
        has: vi.fn<DataStore["has"]>((id) => store.has(id)),

        addModuleImport: vi.fn<DataStore["addModuleImport"]>(() => {

        }),
    } satisfies DataStore
}
