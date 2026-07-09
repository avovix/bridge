import { defineError } from "../internal/error-define";

export const PayloadErrors = {
    fetchFailed: defineError({
        code: "PAYLOAD_FETCH_FAILED", 
        name: 'PayloadFetchError',
        message: (collection: string) => `Failed to fetch "${collection}" from Payload.`,
        hint: 'Check that your adapter is configured and the Payload API is reachable.',
    }),
    entryFetchFailed: defineError({
        code: "PAYLOAD_ENTRY_FETCH_FAILED",
        name: 'PayloadEntryFetchError',
        message: (collection: string, id: string | number) =>
        `Failed to fetch entry "${id}" from "${collection}".`,
        hint: 'Verify the id exists and the collection is correct.',
    }),
    // exclude as unused + test coverage gets upset
    // validationFailed: defineError({
    //     code: "PAYLOAD_VALIDATION_FAILED",
    //     name: 'PayloadValidationError',
    //     message: (collection: string, id: string) =>
    //     `Entry "${id}" in "${collection}" failed schema validation.`,
    //     hint: 'Check your collection schema matches the Payload document shape.',
    // }),
    nonUniqueIdField: defineError({
        code: "PAYLOAD_NON_UNIQUE_ID_FIELD",
        name: "PayloadNonUniqueIdFieldError",
        message: (collection: string, idField: string) =>
            `idField "${idField}" matched multiple documents in "${collection}". It must be unique.`,
        hint: "Use a unique field for idField, or ensure the field has no duplicate values.",
    }),

} as const
