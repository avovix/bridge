# astro-payload-with-sdk

An example that shows how to use `@avovix/astro-loader-payload` with the Payload SDK.

It loads content from a Payload CMS into Astro's content layer using the SDK adapter, so you can query it with `getCollection` and `getEntry` like any other Astro collection.

## What's inside

- `web` is the Astro app. It uses the content loader to pull data from Payload.
- `cms` is the Payload instance that the loader fetches from.

## How it works

The loader is wired up in `web/src/content.config.ts`. It uses the SDK adapter, which talks to Payload over its REST API. You give it a Payload SDK client and a collection slug, and it populates the store at build time.

Pages then read that content with `getCollection`, with no knowledge of where the data came from.

## Running it

1. Start the Payload instance in `cms`.
2. Start the Astro app in `web`.
3. The loader fetches from Payload when the content layer syncs.
