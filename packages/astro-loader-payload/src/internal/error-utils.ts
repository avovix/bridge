import { LiveCollectionError } from "astro/content/runtime";
import { AstroError } from "astro/errors";
import type { PayloadErrorDefinition } from "../types";
import { PayloadErrors } from "../data/errors-data";

const payloadErrorCodes = new Set(Object.values(PayloadErrors).map((d) => d.code));

export class PayloadLoaderError extends AstroError {
    readonly code: string
    readonly source = "payload-loader"
    readonly live = false

    private constructor(
        def: PayloadErrorDefinition,
        args: readonly unknown[],
        cause?: Error,
    ) {
        super(def.message(...args), def.hint);
        this.name = def.name;
        this.code = def.code;
        if (cause) this.cause = cause;
    }

    static from<const TArgs extends readonly unknown[]>(
        def: PayloadErrorDefinition<string, string, TArgs>,
        args: TArgs,
        cause?: Error,
    ): PayloadLoaderError {
        return new PayloadLoaderError(def as PayloadErrorDefinition, args, cause);
    }

    static override is(e: unknown): e is PayloadLoaderError {
        return !!e
        && (e as any).source === "payload-loader"
        && (e as any).live === false
        && payloadErrorCodes.has((e as any).code);
    }
}

export class PayloadLiveError extends LiveCollectionError {
    readonly code: string;
    readonly hint: string | undefined;
    readonly source = "payload-loader";
    readonly live = true;

    private constructor(
        collection: string,
        def: PayloadErrorDefinition,
        args: readonly unknown[],
        cause?: Error,
    ) {
        super(collection, def.message(...args), cause);
        this.name = def.name;
        this.code = def.code;
        this.hint = def.hint;  
    }

    static from<const TArgs extends readonly unknown[]>(
        collection: string,
        def: PayloadErrorDefinition<string, string, TArgs>,
        args: TArgs,
        cause?: Error,
    ): PayloadLiveError {
        return new PayloadLiveError(collection, def as PayloadErrorDefinition, args, cause);
    }

    static override is(e: unknown): e is PayloadLiveError {
        return !!e
        && (e as any).source === "payload-loader"
        && (e as any).live === true
        && payloadErrorCodes.has((e as any).code);
    }
}
