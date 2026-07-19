import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLayoutMap, keyForCode, supportsLayoutMap } from 'key-event-plus'

const stubLayoutMap = (entries: [string, string][]) => {
  vi.stubGlobal('navigator', {
    keyboard: { getLayoutMap: () => Promise.resolve(new Map(entries)) },
  })
}

describe('layout helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('supportsLayoutMap', () => {
    it('is false when navigator.keyboard is missing', () => {
      expect(supportsLayoutMap()).toBe(false)
    })

    it('is false when navigator is missing entirely', () => {
      vi.stubGlobal('navigator', undefined)
      expect(supportsLayoutMap()).toBe(false)
    })

    it('is true when getLayoutMap is available', () => {
      stubLayoutMap([])
      expect(supportsLayoutMap()).toBe(true)
    })
  })

  describe('getLayoutMap', () => {
    it('returns the layout map where supported', async () => {
      stubLayoutMap([['KeyY', 'z']])
      const map = await getLayoutMap()
      expect(map.get('KeyY')).toBe('z')
    })

    it('returns an empty map where unsupported', async () => {
      const map = await getLayoutMap()
      expect(map.size).toBe(0)
    })
  })

  describe('keyForCode', () => {
    it('resolves through the layout map', async () => {
      stubLayoutMap([['KeyY', 'z']]) // QWERTZ
      await expect(keyForCode('KeyY')).resolves.toBe('z')
    })

    it('falls back to deriving letters from the code', async () => {
      await expect(keyForCode('KeyA')).resolves.toBe('a')
    })

    it('falls back to deriving digits from the code', async () => {
      await expect(keyForCode('Digit7')).resolves.toBe('7')
    })

    it('falls back when the layout map misses the code', async () => {
      stubLayoutMap([['KeyY', 'z']])
      await expect(keyForCode('KeyQ')).resolves.toBe('q')
    })

    it('returns undefined for non-character codes', async () => {
      await expect(keyForCode('F5')).resolves.toBeUndefined()
      await expect(keyForCode('ShiftLeft')).resolves.toBeUndefined()
    })
  })
})
