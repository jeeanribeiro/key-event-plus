import { afterEach, describe, expect, it, vi } from 'vitest'
import { onKey, type KeyEvent } from 'key-event-plus'

const press = (
  target: EventTarget,
  type: 'keydown' | 'keyup',
  init: KeyboardEventInit = {},
): KeyboardEvent => {
  const event = new KeyboardEvent(type, { key: 'a', code: 'KeyA', ...init })
  target.dispatchEvent(event)
  return event
}

describe('onKey', () => {
  const unsubs: (() => void)[] = []
  const listen = (...args: Parameters<typeof onKey>) => {
    const off = onKey(...args)
    unsubs.push(off)
    return off
  }

  afterEach(() => {
    unsubs.splice(0).forEach((off) => {
      off()
    })
  })

  it('emits a down event with key, code, state and repeat', () => {
    const handler = vi.fn()
    listen(handler)

    press(window, 'keydown', { key: 'k', code: 'KeyK' })

    expect(handler).toHaveBeenCalledTimes(1)
    const [event] = handler.mock.calls[0] as [KeyEvent]
    expect(event).toEqual({
      key: 'k',
      code: 'KeyK',
      state: 'down',
      repeat: false,
      modifiers: { alt: false, ctrl: false, meta: false, shift: false },
    })
  })

  it('emits an up event when the key is released', () => {
    const handler = vi.fn()
    listen(handler)

    press(window, 'keyup', { key: 'k', code: 'KeyK' })

    const [event] = handler.mock.calls[0] as [KeyEvent]
    expect(event.state).toBe('up')
  })

  it('passes the native KeyboardEvent as the second argument', () => {
    const handler = vi.fn()
    listen(handler)

    const native = press(window, 'keydown')

    expect(handler.mock.calls[0]?.[1]).toBe(native)
  })

  it('captures modifier state per event', () => {
    const handler = vi.fn()
    listen(handler)

    press(window, 'keydown', { key: 'K', code: 'KeyK', ctrlKey: true, shiftKey: true })

    const [event] = handler.mock.calls[0] as [KeyEvent]
    expect(event.modifiers).toEqual({ alt: false, ctrl: true, meta: false, shift: true })
  })

  it('never misses fast successive keystrokes', () => {
    const seen: string[] = []
    listen((e) => seen.push(`${e.key}:${e.state}`))

    for (const key of ['a', 'b', 'c', 'd', 'e']) {
      press(window, 'keydown', { key, code: `Key${key.toUpperCase()}` })
      press(window, 'keyup', { key, code: `Key${key.toUpperCase()}` })
    }

    expect(seen).toHaveLength(10)
    expect(seen.slice(0, 4)).toEqual(['a:down', 'a:up', 'b:down', 'b:up'])
  })

  it('emits a fresh object per event (no shared mutable state)', () => {
    const events: KeyEvent[] = []
    listen((e) => events.push(e))

    press(window, 'keydown', { key: 'a', code: 'KeyA' })
    press(window, 'keyup', { key: 'a', code: 'KeyA' })

    expect(events[0]).not.toBe(events[1])
    expect(events[0]?.state).toBe('down')
    expect(events[1]?.state).toBe('up')
  })

  it('emits deeply frozen events', () => {
    const handler = vi.fn()
    listen(handler)

    press(window, 'keydown')

    const [event] = handler.mock.calls[0] as [KeyEvent]
    expect(Object.isFrozen(event)).toBe(true)
    expect(Object.isFrozen(event.modifiers)).toBe(true)
    expect(() => {
      ;(event as { key: string }).key = 'hacked'
    }).toThrow(TypeError)
  })

  it('reports auto-repeat and can filter it with preventRepeat', () => {
    const all = vi.fn()
    const filtered = vi.fn()
    listen(all)
    listen(filtered, { preventRepeat: true })

    press(window, 'keydown', { key: 'a', code: 'KeyA' })
    press(window, 'keydown', { key: 'a', code: 'KeyA', repeat: true })

    expect(all).toHaveBeenCalledTimes(2)
    expect((all.mock.calls[1]?.[0] as KeyEvent).repeat).toBe(true)
    expect(filtered).toHaveBeenCalledTimes(1)
  })

  it('listens on a custom target', () => {
    const input = document.createElement('input')
    document.body.append(input)
    const onWindowOnly = vi.fn()
    const onInput = vi.fn()
    listen(onInput, { target: input })
    listen(onWindowOnly)

    const event = new KeyboardEvent('keydown', { key: 'x', code: 'KeyX' })
    input.dispatchEvent(event)

    expect(onInput).toHaveBeenCalledTimes(1)
    input.remove()
  })

  it('unsubscribe removes both listeners', () => {
    const handler = vi.fn()
    const off = onKey(handler)

    press(window, 'keydown')
    off()
    press(window, 'keydown')
    press(window, 'keyup')

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe is idempotent', () => {
    const handler = vi.fn()
    const off = onKey(handler)

    off()
    expect(() => {
      off()
    }).not.toThrow()
    press(window, 'keydown')
    expect(handler).not.toHaveBeenCalled()
  })
})
