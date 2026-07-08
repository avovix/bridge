import type { AstroIntegrationLogger } from "astro";
import { vi } from "vitest";
import type { Mock } from "vitest";

export class LoggerMock implements AstroIntegrationLogger {
    public options: AstroIntegrationLogger["options"];
    public label: string;

    constructor(
        label = "mock",
        options = {} as AstroIntegrationLogger["options"],
    ) {
        this.label = label;
        this.options = options;
    }

    // Returns a child logger with the same options but a new label.
    public fork: Mock<AstroIntegrationLogger["fork"]> = vi.fn(
        (label: string): AstroIntegrationLogger => {
        return new LoggerMock(label, this.options);
        },
    );

    // Mocked log methods so tests can assert calls.
    public info = vi.fn<AstroIntegrationLogger["info"]>();
    public warn = vi.fn<AstroIntegrationLogger["warn"]>();
    public error = vi.fn<AstroIntegrationLogger["error"]>();
    public debug = vi.fn<AstroIntegrationLogger["debug"]>();

    // Included because Astro's logger exposes them.
    public flush = vi.fn<AstroIntegrationLogger["flush"]>();
    public close = vi.fn<AstroIntegrationLogger["close"]>();

}