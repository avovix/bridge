import { describe, expect, it } from "vitest";
import { PayloadLoaderError, PayloadLiveError } from "../../src/internal/error-utils";
import { PayloadErrors } from "../../src/data/errors-data";

describe("PayloadLoaderError", () => {
    it("constructs from a definition with the correct name, code, message, hint", () => {
        const error = PayloadLoaderError.from(PayloadErrors.fetchFailed, ["posts"]);

        expect(error.name).toBe("PayloadFetchError");
        expect(error.code).toBe("PAYLOAD_FETCH_FAILED");
        expect(error.message).toContain("posts");
        expect(error.hint).toBeDefined();
        expect(error.source).toBe("payload-loader");
        expect(error.live).toBe(false);
    });

    it("preserves the cause when an Error is passed", () => {
        const cause = new Error("network down");
        const error = PayloadLoaderError.from(PayloadErrors.fetchFailed, ["posts"], cause);

        expect(error.cause).toBe(cause);
    });

    describe("is()", () => {
        it("returns true for its own errors", () => {
        const error = PayloadLoaderError.from(PayloadErrors.fetchFailed, ["posts"]);
        expect(PayloadLoaderError.is(error)).toBe(true);
        });

        it("returns false for a live error (discriminates build vs live)", () => {
        const live = PayloadLiveError.from("posts", PayloadErrors.fetchFailed, ["posts"]);
        expect(PayloadLoaderError.is(live)).toBe(false);
        });

        it("returns false for a plain Error", () => {
        expect(PayloadLoaderError.is(new Error("nope"))).toBe(false);
        });

        it("returns false for null / non-objects", () => {
        expect(PayloadLoaderError.is(null)).toBe(false);
        expect(PayloadLoaderError.is(undefined)).toBe(false);
        expect(PayloadLoaderError.is("string")).toBe(false);
        });

        it("returns false for an object with the wrong shape", () => {
        expect(PayloadLoaderError.is({ source: "payload-loader", live: false, code: "UNKNOWN_CODE" })).toBe(false);
        });
    });
});

describe("PayloadLiveError", () => {
    it("constructs with collection, name, code, hint", () => {
        const error = PayloadLiveError.from("posts", PayloadErrors.entryFetchFailed, ["posts", "123"]);

        expect(error.name).toBe("PayloadEntryFetchError");
        expect(error.code).toBe("PAYLOAD_ENTRY_FETCH_FAILED");
        expect(error.collection).toBe("posts");
        expect(error.message).toContain("123");
        expect(error.hint).toBeDefined();
        expect(error.source).toBe("payload-loader");
        expect(error.live).toBe(true);
    });

    it("preserves the cause when an Error is passed", () => {
        const cause = new Error("boom");
        const error = PayloadLiveError.from("posts", PayloadErrors.entryFetchFailed, ["posts", "1"], cause);

        expect(error.cause).toBe(cause);
    });

    describe("is()", () => {
        it("returns true for its own errors", () => {
        const error = PayloadLiveError.from("posts", PayloadErrors.entryFetchFailed, ["posts", "1"]);
        expect(PayloadLiveError.is(error)).toBe(true);
        });

        it("returns false for a build error (discriminates live vs build)", () => {
        const build = PayloadLoaderError.from(PayloadErrors.fetchFailed, ["posts"]);
        expect(PayloadLiveError.is(build)).toBe(false);
        });

        it("returns false for a plain Error", () => {
        expect(PayloadLiveError.is(new Error("nope"))).toBe(false);
        });

        it("returns false for null / non-objects", () => {
        expect(PayloadLiveError.is(null)).toBe(false);
        });
    });
});
