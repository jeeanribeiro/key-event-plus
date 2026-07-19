// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { getLayoutMap, hotkey, keyForCode, onKey, supportsLayoutMap } from 'key-event-plus'

describe('SSR safety (no window, no navigator)', () => {
  it('onKey is a no-op and returns a callable unsubscribe', () => {
    const handler = vi.fn()
    const off = onKey(handler)
    expect(() => {
      off()
    }).not.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })

  it('hotkey is a no-op and mod parsing does not crash without navigator', () => {
    const off = hotkey('mod+shift+k', vi.fn())
    expect(() => {
      off()
    }).not.toThrow()
  })

  it('supportsLayoutMap is false', () => {
    expect(supportsLayoutMap()).toBe(false)
  })

  it('getLayoutMap resolves to an empty map', async () => {
    const map = await getLayoutMap()
    expect(map.size).toBe(0)
  })

  it('keyForCode falls back to code-derived keys', async () => {
    await expect(keyForCode('KeyB')).resolves.toBe('b')
    await expect(keyForCode('Escape')).resolves.toBeUndefined()
  })

  it('onKey still attaches to an explicit target', () => {
    const handler = vi.fn()
    const target = new EventTarget()
    const off = onKey(handler, { target })

    target.dispatchEvent(new Event('keydown'))
    expect(handler).toHaveBeenCalledTimes(1)

    off()
    target.dispatchEvent(new Event('keydown'))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
