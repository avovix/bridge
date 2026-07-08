import { describe, expect, it } from 'vitest'
import { resolveLoaderName } from '../../src/internal/resolve-name'


describe('resolveLoaderName: builds the loader log name from options', () => {
    it('returns generic name when null', () => {
        expect(resolveLoaderName('posts', null)).toBe('payload-loader')
    })

    it('uses the override string when provided', () => {
        expect(resolveLoaderName('posts', 'bespoke')).toBe('bespoke')
    })

    it('defaults to slug when undefined', () => {
        expect(resolveLoaderName('posts', undefined)).toBe('payload-loader:posts')
    })
})