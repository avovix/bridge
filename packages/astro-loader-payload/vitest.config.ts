/// <reference types="vitest/config" />

import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/adapters/adapter-base.ts',
        'src/adapters/payload-sdk.ts',
        'src/adapters/payload-local.ts',
        'src/adapters/payload-graphql.ts',
        'src/types/**',
      ],
    },
  },
} as Parameters<typeof getViteConfig>[0])

