import { afterEach, describe, expect, it, vi } from 'vitest'
import { hotkey } from 'key-event-plus'

const dispatch = (
  init: KeyboardEventInit,
  type: 'keydown' | 'keyup' = 'keydown',
): KeyboardEvent => {
  const event = new KeyboardEvent(type, { cancelable: true, ...init })
  window.dispatchEvent(event)
  return event
}

const stubPlatform = (platform: string, userAgent = '') => {
  vi.stubGlobal('navigator', { platform, userAgent })
}

describe('hotkey', () => {
  const unsubs: (() => void)[] = []
  const bind = (...args: Parameters<typeof hotkey>) => {
    const off = hotkey(...args)
    unsubs.push(off)
    return off
  }

  afterEach(() => {
    unsubs.splice(0).forEach((off) => {
      off()
    })
    vi.unstubAllGlobals()
  })

  it('fires on an exact modifier+key match', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('mod+shift+k', handler)

    dispatch({ key: 'K', code: 'KeyK', ctrlKey: true, shiftKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('resolves mod to Ctrl on non-Apple platforms', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('mod+k', handler)

    dispatch({ key: 'k', code: 'KeyK', metaKey: true })
    expect(handler).not.toHaveBeenCalled()

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('resolves mod to Cmd on macOS', () => {
    stubPlatform('MacIntel')
    const handler = vi.fn()
    bind('mod+k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()

    dispatch({ key: 'k', code: 'KeyK', metaKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('prefers userAgentData.platform when present', () => {
    vi.stubGlobal('navigator', {
      userAgentData: { platform: 'macOS' },
      platform: 'Win32',
      userAgent: '',
    })
    const handler = vi.fn()
    bind('mod+k', handler)

    dispatch({ key: 'k', code: 'KeyK', metaKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('treats mod as Ctrl when no platform signal is available', () => {
    vi.stubGlobal('navigator', {})
    const handler = vi.fn()
    bind('mod+k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('treats mod as Ctrl when navigator is missing entirely', () => {
    vi.stubGlobal('navigator', undefined)
    const handler = vi.fn()
    bind('mod+k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('detects Apple platforms from the user agent when platform is empty', () => {
    stubPlatform('', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    const handler = vi.fn()
    bind('mod+k', handler)

    dispatch({ key: 'k', code: 'KeyK', metaKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('requires modifiers to match exactly', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('ctrl+k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true, altKey: true })
    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true, shiftKey: true })
    dispatch({ key: 'k', code: 'KeyK' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('supports modifier synonyms', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('control+option+command+x', handler)

    dispatch({ key: 'x', code: 'KeyX', ctrlKey: true, altKey: true, metaKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('accepts every modifier spelling', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('alt+x', handler)
    bind('meta+x', handler)
    bind('cmd+x', handler)
    bind('super+x', handler)
    bind('win+x', handler)

    dispatch({ key: 'x', code: 'KeyX', altKey: true })
    dispatch({ key: 'x', code: 'KeyX', metaKey: true })

    // one alt match + four meta spellings matching the same event
    expect(handler).toHaveBeenCalledTimes(5)
  })

  it('fires on keydown only', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('ctrl+k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true }, 'keyup')

    expect(handler).not.toHaveBeenCalled()
  })

  it('supports key aliases', () => {
    stubPlatform('Win32')
    const esc = vi.fn()
    const space = vi.fn()
    const plus = vi.fn()
    const arrow = vi.fn()
    bind('esc', esc)
    bind('space', space)
    bind('ctrl+plus', plus)
    bind('up', arrow)

    dispatch({ key: 'Escape', code: 'Escape' })
    dispatch({ key: ' ', code: 'Space' })
    dispatch({ key: '+', code: 'BracketRight', ctrlKey: true })
    dispatch({ key: 'ArrowUp', code: 'ArrowUp' })

    expect(esc).toHaveBeenCalledTimes(1)
    expect(space).toHaveBeenCalledTimes(1)
    expect(plus).toHaveBeenCalledTimes(1)
    expect(arrow).toHaveBeenCalledTimes(1)
  })

  it('matches letters by physical key on non-Latin layouts', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('ctrl+k', handler)

    // Cyrillic ЙЦУКЕН layout: the physical K key produces "л"
    dispatch({ key: 'л', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('matches digits by physical key when the layout shifts them', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('shift+1', handler)

    // US layout: Shift+1 produces "!"
    dispatch({ key: '!', code: 'Digit1', shiftKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not match a different physical key', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('ctrl+k', handler)
    bind('ctrl+1', handler)

    dispatch({ key: 'л', code: 'KeyL', ctrlKey: true })
    dispatch({ key: 'ы', code: 'Digit2', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not apply the physical-key fallback to multi-character keys', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('enter', handler)

    dispatch({ key: 'NumpadEnter', code: 'Enter' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('calls preventDefault only when asked', () => {
    stubPlatform('Win32')
    bind('ctrl+s', vi.fn())
    const silent = dispatch({ key: 's', code: 'KeyS', ctrlKey: true })
    expect(silent.defaultPrevented).toBe(false)

    bind('ctrl+d', vi.fn(), { preventDefault: true })
    const prevented = dispatch({ key: 'd', code: 'KeyD', ctrlKey: true })
    expect(prevented.defaultPrevented).toBe(true)
  })

  it('respects preventRepeat', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('ctrl+k', handler, { preventRepeat: true })

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })
    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true, repeat: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('listens on a custom target', () => {
    stubPlatform('Win32')
    const input = document.createElement('input')
    document.body.append(input)
    const handler = vi.fn()
    bind('ctrl+k', handler, { target: input })

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true }))
    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
    input.remove()
  })

  it('returns a working unsubscribe', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    const off = hotkey('ctrl+k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })
    off()
    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores surrounding whitespace in combos', () => {
    stubPlatform('Win32')
    const handler = vi.fn()
    bind('ctrl + k', handler)

    dispatch({ key: 'k', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('throws on modifier-only combos', () => {
    stubPlatform('Win32')
    expect(() => hotkey('ctrl+shift', vi.fn())).toThrow('needs one non-modifier key')
  })
})
