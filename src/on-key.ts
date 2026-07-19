import type { KeyEvent, KeyHandler, KeyState, OnKeyOptions, Unsubscribe } from './types'

const NOOP: Unsubscribe = () => undefined

const snapshot = (e: KeyboardEvent, state: KeyState): KeyEvent =>
  Object.freeze({
    key: e.key,
    code: e.code,
    state,
    repeat: e.repeat,
    modifiers: Object.freeze({
      alt: e.altKey,
      ctrl: e.ctrlKey,
      meta: e.metaKey,
      shift: e.shiftKey,
    }),
  })

/**
 * Subscribe to keyboard activity on `target` (defaults to `window`).
 *
 * Event-driven — listens to `keydown`/`keyup` directly, so no keystroke is
 * ever coalesced or lost. Each emission is a fresh, deeply frozen
 * {@link KeyEvent}. Returns an {@link Unsubscribe} that detaches both
 * listeners.
 *
 * Safe to call during SSR: without a `window` (and no explicit `target`) it
 * attaches nothing and returns a no-op unsubscribe.
 */
export function onKey(handler: KeyHandler, options: OnKeyOptions = {}): Unsubscribe {
  const target = options.target ?? (typeof window === 'undefined' ? undefined : window)
  if (!target) return NOOP

  const down = (e: KeyboardEvent): void => {
    if (options.preventRepeat && e.repeat) return
    handler(snapshot(e, 'down'), e)
  }
  const up = (e: KeyboardEvent): void => {
    handler(snapshot(e, 'up'), e)
  }

  target.addEventListener('keydown', down as EventListener)
  target.addEventListener('keyup', up as EventListener)

  return () => {
    target.removeEventListener('keydown', down as EventListener)
    target.removeEventListener('keyup', up as EventListener)
  }
}
