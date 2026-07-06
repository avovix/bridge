# @avovix/astro-loader-payload

An [Astro content layer](https://docs.astro.build/en/guides/content-collections/) loader for [Payload CMS](https://payloadcms.com).

Load your Payload collections into Astro's content layer and query them with `getCollection` and `getEntry`, just like any other Astro collection.

> **Alpha.** This is a new package. The API may change before `1.0`. Feedback and issues welcome.

## Status & feedback

This is an early release and fuller documentation is on the way. It is an
open-source project and I want it to fit as many real-world setups as possible,
so if something is missing, unclear, or doesn't fit your use case, please
[open a discussion](https://github.com/avovix/bridge/discussions) or an
[issue](https://github.com/avovix/bridge/issues).

## Why this loader

- **Fully typed:** `collectionSlug`, `idField`, and query options are typed against your own Payload `Config`, so you get autocomplete and type-checking for your collections and fields directly in `content.config.ts` and `live.config.ts`.
- **Uses your own Payload client:** you pass in the SDK client you already configured, so it always matches your Payload version and you keep the full range of client options (auth, base URL, custom fetch, and more) without waiting on this package to expose them. The SDK client is supported now, with Local API and GraphQL planned.
- **Build-time and live:** covers static content collections and live (on-demand) collections.
- **Full query passthrough:** anything Payload's find supports (`where`, `sort`, `depth`, `locale`, `draft`, and more) is passed straight through, not limited to a fixed set of options.

A complete, runnable setup lives in the [`astro-payload-with-sdk` example](../../examples/astro-payload-with-sdk).

## Install

```sh
pnpm add @avovix/astro-loader-payload
# peers you likely already have:
pnpm add payload @payloadcms/sdk
```

`payload` and `astro` are required peer dependencies. `@payloadcms/sdk` is an optional peer, needed only if you use the SDK adapter.

## Quick start

Build your Payload SDK client, wrap it in the SDK adapter, and pass it to the loader:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content'
import { payloadCollectionLoader, payloadSdkAdapter } from '@avovix/astro-loader-payload'
import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types' // your generated Payload types

const sdk = new PayloadSDK<Config>({
  baseURL: import.meta.env.PAYLOAD_BASE_URL, // e.g. http://localhost:3000/api
})

const posts = defineCollection({
  loader: payloadCollectionLoader({
    adapter: payloadSdkAdapter(sdk),
    collectionSlug: 'posts',
  }),
})

export const collections = { posts }
```

Then query it in a page like any Astro collection:

```astro
---
import { getCollection } from 'astro:content'
const posts = await getCollection('posts')
---
<ul>
  {posts.map((post) => (
    <li><a href={`/post/${post.data.slug}/`}>{post.data.title}</a></li>
  ))}
</ul>
```

The loader populates the content store; your pages never touch Payload directly.

## Adding a schema

The loader works without a schema, but defining one gives you validated, fully
typed `.data` in your pages (the standard Astro content collections feature).
Pass a Zod schema to `defineCollection` as usual:

```ts
import { defineCollection, z } from 'astro:content'
import { payloadCollectionLoader, payloadSdkAdapter } from '@avovix/astro-loader-payload'

const posts = defineCollection({
  loader: payloadCollectionLoader({
    adapter: payloadSdkAdapter(sdk),
    collectionSlug: 'posts',
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().optional(),
  }),
})
```

Now `post.data` is typed as `{ title: string; slug: string; excerpt?: string }`
in your pages. If you would rather store the raw Payload document without
validation, pass `skipValidation: true` in the loader options instead.

## Options

```ts
payloadCollectionLoader({
  adapter,             // required. A Payload adapter (see below).
  collectionSlug,      // required. The collection to load, e.g. 'posts'.

  skipValidation,      // optional. Skip Astro schema validation of each entry.
  loaderName,          // optional. Log name (defaults to the slug; null to disable).
  idField,             // optional. Which field becomes the entry id (default: 'id').
  query,               // optional. where / sort / limit / depth / locale / draft, and more.
})
```

### `idField`

By default entries are keyed by the Payload document `id`. Set `idField` to key them by another field so you can look them up directly:

```ts
payloadCollectionLoader({
  adapter: payloadSdkAdapter(sdk),
  collectionSlug: 'posts',
  idField: 'slug', // now getEntry('posts', 'my-slug') works
})
```

If you use a custom `idField`, make sure that field is unique on the collection.

### `query`

Anything you can pass to a Payload find is passed straight through:

```ts
payloadCollectionLoader({
  adapter: payloadSdkAdapter(sdk),
  collectionSlug: 'posts',
  query: {
    where: { _status: { equals: 'published' } },
    sort: '-createdAt',
    depth: 1,
  },
})
```

## Live collections

For always-fresh data (SSR / on-demand rendering), use the live loader with a
`live.config.ts` and query it with `getLiveCollection` / `getLiveEntry`.

```ts
// src/live.config.ts
import { defineLiveCollection } from 'astro:content'
import { payloadLiveCollectionLoader, payloadSdkAdapter } from '@avovix/astro-loader-payload'
import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types'

const sdk = new PayloadSDK<Config>({ baseURL: import.meta.env.PAYLOAD_BASE_URL })

const posts = defineLiveCollection({
  loader: payloadLiveCollectionLoader({
    adapter: payloadSdkAdapter(sdk),
    collectionSlug: 'posts',
  }),
})

export const collections = { posts }
```

Unlike the build-time loader (which takes a `query` option), the live loader
receives a **`filter`** per request. It has the same shape as `query` and is
passed at call time through `getLiveCollection` / `getLiveEntry`:

```ts
import { getLiveCollection, getLiveEntry } from 'astro:content'

// filter a live collection
const { entries } = await getLiveCollection('posts', {
  where: { _status: { equals: 'published' } },
  sort: '-createdAt',
})

// fetch a single live entry by id (or your idField)
const { entry } = await getLiveEntry('posts', { id: Astro.params.slug })
```

Live collections require an adapter configured for on-demand rendering and do not
use the build-time content store.

## Using Payload types in your Astro app (monorepo)

If Payload and Astro live in the same monorepo, expose your Payload config and
generated types from the CMS package so the Astro app can import `Config`:

```ts
// cms/src/index.ts
export { default as config } from './payload.config'
export * from './payload-types'
```

```jsonc
// cms/package.json
"exports": {
  ".": {
    "import": "./src/index.ts",
    "types": "./src/index.ts",
    "default": "./src/index.ts"
  }
}
```

## Known limitations & gotchas

- **Alpha:** API may change before `1.0`.
- **Entry limit:** the loader fetches up to 1000 entries per collection by default. Pass `query.limit` to change it. Full pagination traversal is planned.
- **HMR in dev:** due to [an Astro limitation](https://github.com/withastro/astro/issues/13253), define your collections directly in `content.config.ts` rather than in a separate imported file, or HMR may not pick up changes.
- **Empty on first run:** if a collection appears empty when you first start the dev server, trigger a content sync with `s` + Enter, or restart the server.
- **SDK adapter only for now:** Local API and GraphQL adapters are planned.

## License

MIT © Avovix
