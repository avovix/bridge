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

- **Fully typed:** `collection`, `idField`, and query options are typed against your own Payload `Config`, so you get autocomplete and type-checking for your collections and fields directly in `content.config.ts` and `live.config.ts`.
- **Uses your own Payload client:** you pass in the client you already configured (the SDK for REST, or a Payload instance for the Local API), so it always matches your Payload version and you keep the full range of client options without waiting on this package to expose them. SDK and Local API adapters are supported now, with GraphQL planned.
- **Build-time and live:** covers static content collections and live (on-demand) collections.
- **Full query passthrough:** anything Payload's find supports (`where`, `sort`, `depth`, `locale`, `draft`, and more) is passed straight through, not limited to a fixed set of options.
- **Typed errors:** failures come through as typed errors with a stable `code`, a `hint`, and a `static is()` guard, so you can identify and handle them precisely instead of matching on message strings.

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
    collection: 'posts',
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

## Adapters

The loader talks to Payload through an adapter. You build the client and pass it
in, so the loader stays decoupled from how you connect.

### SDK adapter (REST)

Best when Astro and Payload are deployed separately. You give it a configured
`PayloadSDK` client (as shown in the quick start):

```ts
import { payloadSdkAdapter } from '@avovix/astro-loader-payload'
import { PayloadSDK } from '@payloadcms/sdk'

const sdk = new PayloadSDK<Config>({ baseURL: import.meta.env.PAYLOAD_BASE_URL })

payloadCollectionLoader({ adapter: payloadSdkAdapter(sdk), collection: 'posts' })
```

### Local API adapter

Best when Astro and Payload run together (for example, in the same monorepo).
It uses Payload's Local API in-process, so there is no HTTP server to run. You
give it a Payload instance:

```ts
import { getPayload } from 'payload'
import config from './payload.config'
import { payloadLocalAdapter } from '@avovix/astro-loader-payload'

const payload = await getPayload({ config })

payloadCollectionLoader({ adapter: payloadLocalAdapter(payload), collection: 'posts' })
```

### Local for dev, SDK for deploy

Because both adapters satisfy the same interface, you can switch between them
without changing the rest of your loader setup, for example using the Local API
locally and the SDK in a decoupled deployment:

```ts
const adapter = import.meta.env.DEV
  ? payloadLocalAdapter(await getPayload({ config }))
  : payloadSdkAdapter(new PayloadSDK<Config>({ baseURL: import.meta.env.PAYLOAD_BASE_URL }))

payloadCollectionLoader({ adapter, collection: 'posts' })
```

The Local API adapter needs your Payload config and database available at build
time, which suits co-located setups; the SDK adapter works whenever a running
Payload API is reachable.

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
    collection: 'posts',
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
  collection,      // required. The collection to load, e.g. 'posts'.

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
  collection: 'posts',
  idField: 'slug', // now getEntry('posts', 'my-slug') works
})
```

If you use a custom `idField`, make sure that field is unique on the collection.

### `query`

Anything you can pass to a Payload find is passed straight through:

```ts
payloadCollectionLoader({
  adapter: payloadSdkAdapter(sdk),
  collection: 'posts',
  query: {
    where: { _status: { equals: 'published' } },
    sort: '-createdAt',
    depth: 1,
  },
})
```

### `pagination` (build loader)

Payload paginates finds with a default `limit` of 10, so a plain find returns
only the first 10 documents. To avoid silently dropping entries, the build loader
fetches **all** documents by default. You choose the strategy with `mode`:

```ts
payloadCollectionLoader({
  adapter: payloadSdkAdapter(sdk),
  collection: 'posts',
  pagination: {
    mode: 'default', // 'default' | 'single' | 'stream'
  },
})
```

- **`default`** — probes the first page to see how large the collection is, then
  adapts: small collections are fetched in a single request, while large ones are
  streamed page by page. A good choice for most cases.
- **`single`** — fetches everything in one request (`pagination: false`). Best
  when you know the collection is small and want a single round trip.
- **`stream`** — always traverses page by page, processing each page as it
  arrives, keeping memory flat for very large collections.

You have two levers over pagination:

- **`pagination.mode`** — chooses the strategy above.
- **`query.limit`** — sets the **page size** used while streaming (how many
  documents are fetched per request). Lower it to reduce memory per request on
  very large collections, or raise it to make fewer requests. If unset, a sensible
  default is used.

```ts
payloadCollectionLoader({
  adapter: payloadSdkAdapter(sdk),
  collection: 'posts',
  pagination: { mode: 'stream' },
  query: { limit: 200 }, // fetch 200 documents per request while streaming
})
```

Anything else you put in `query` (`where`, `sort`, `depth`, and so on) is
respected as usual; only the pagination controls (`limit`, `page`, `pagination`)
are managed by the loader when fetching all documents.

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
    collection: 'posts',
  }),
})

export const collections = { posts }
```

### Pagination in live collections

The live loader returns **all** matching documents by default (it uses
`pagination: false` under the hood). Because live collections run per request,
you control pagination through the `filter` you pass to `getLiveCollection`,
rather than a loader option:

```ts
// a page of results
const { entries } = await getLiveCollection('posts', { limit: 20, page: 2 })

// all results (the default, shown explicitly)
const { entries } = await getLiveCollection('posts', { pagination: false })
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

## Error handling

Failures produce typed errors so you can identify and handle them precisely. How
an error is delivered depends on the loader:

- **Build loader** (`load`) **throws** a `PayloadLoaderError`. It surfaces in
  Astro's error overlay with a message and hint, and fails the build, which is the
  correct behaviour for build-time content.
- **Live loader** (`loadCollection` / `loadEntry`) **returns** `{ error }` (a
  `PayloadLiveError`) instead of throwing, so a request can fail without crashing
  the page.

A **missing live entry returns `undefined`, not an error** — "not found" is a
normal result, so `getLiveEntry` returns `undefined` and your page can render a
404 or fallback. An error is only returned when something is actually wrong (a
failed fetch, or a non-unique `idField`).

### Error codes

Every error carries a stable `code`. Branch on the `code`, not the message text
(the code is stable; messages may be reworded).

| Code | Fires when | Loader | Delivered as |
| --- | --- | --- | --- |
| `PAYLOAD_FETCH_FAILED` | Fetching a collection fails (network, auth, API down) | build + live (`loadCollection`) | thrown (build) / `{ error }` (live) |
| `PAYLOAD_ENTRY_FETCH_FAILED` | Fetching a single entry fails | live (`loadEntry`) | `{ error }` |
| `PAYLOAD_VALIDATION_FAILED` | A document fails Astro schema validation | build | thrown |
| `PAYLOAD_NON_UNIQUE_ID_FIELD` | A custom `idField` matches more than one document | live (`loadEntry`) | `{ error }` |

For the live loader, `loadEntry` also returns `undefined` (no error) when no
document matches the requested id.

### Working with errors

Both error types carry a `code`, a `hint`, and (where available) the original
`cause`, and expose a `static is()` guard for safe narrowing:

```ts
import { getLiveEntry } from 'astro:content'
import { PayloadLiveError } from '@avovix/astro-loader-payload'
import type { PayloadErrorCode } from '@avovix/astro-loader-payload'

const { entry, error } = await getLiveEntry('posts', { id })

if (error && PayloadLiveError.is(error)) {
  // `error` is now typed as PayloadLiveError
  if (error.code === ('PAYLOAD_ENTRY_FETCH_FAILED' satisfies PayloadErrorCode)) {
    // handle a fetch failure
  }
}
```

Prefer `PayloadLiveError.is(error)` / `PayloadLoaderError.is(error)` over
`instanceof`, and branch on `error.code` rather than the message text (the code
is stable; messages may be reworded).

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
- **HMR in dev:** due to [an Astro limitation](https://github.com/withastro/astro/issues/13253), define your collections directly in `content.config.ts` rather than in a separate imported file, or HMR may not pick up changes.
- **Empty on first run:** if a collection appears empty when you first start the dev server, trigger a content sync with `s` + Enter, or restart the server.
- **GraphQL adapter planned:** SDK (REST) and Local API adapters are supported; a GraphQL adapter is planned.

## License

MIT © Avovix
