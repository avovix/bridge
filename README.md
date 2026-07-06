# Avovix Bridge

Packages for connecting systems together, mainly [Payload CMS](https://payloadcms.com) and [Astro](https://astro.build).

The focus is Payload + Astro, but the repo also explores connecting other CMSs and systems through shared, swappable ports, so the same ideas can be reused across different backends.

The aim throughout is good developer experience: keep the APIs simple, give one clear way to do each thing, and hand as much control back to you as possible (including hooks) rather than hiding it behind the abstraction.

## Packages

| Package | Description |
| --- | --- |
| [`@avovix/astro-loader-payload`](packages/astro-loader-payload) | Astro content layer loader for Payload CMS. Build-time and live collections, fully typed against your Payload config. |

More packages are planned.

## Examples

| Example | Description |
| --- | --- |
| [`astro-payload-with-sdk`](examples/astro-payload-with-sdk) | Payload + Astro using the SDK adapter. |

## Contributing

Feedback and contributions are welcome.

- Have an idea, question, or use case that isn't covered? [Start a discussion](https://github.com/avovix/bridge/discussions).
- Found a bug? [Open an issue](https://github.com/avovix/bridge/issues) with a small reproduction if you can.
- Want to contribute code? Open an issue or discussion first so we can talk it through before you start.

AI tools are fine as an assistant for research and learning, but please understand and be able to explain any code you submit. Agent-driven or drive-by PRs will not be merged.

## License

[MIT](LICENSE) © Avovix
