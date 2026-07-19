/** State of a key: pressed down or released. */
export type KeyState = 'down' | 'up'

/** Snapshot of the modifier keys held at the moment of the event. */
export interface Modifiers {
  readonly alt: boolean
  readonly ctrl: boolean
  readonly meta: boolean
  readonly shift: boolean
}

/**
 * Immutable description of a single key event.
 *
 * A fresh, frozen object is created for every emission — callbacks can safely
 * store, compare, or diff events without them changing underneath.
 */
export interface KeyEvent {
  /** The value the key produced on the user's active layout (`KeyboardEvent.key`). */
  readonly key: string
  /** The physical key position, independent of layout (`KeyboardEvent.code`). */
  readonly code: string
  /** Whether the key went down or came back up. */
  readonly state: KeyState
  /** `true` while the key is auto-repeating. */
  readonly repeat: boolean
  /** Modifier keys held when the event fired. */
  readonly modifiers: Modifiers
}

/** Options accepted by {@link onKey}. */
export interface OnKeyOptions {
  /** Where to attach the listeners. Defaults to `window`. */
  target?: EventTarget
  /** Skip auto-repeated `keydown` events. Defaults to `false`. */
  preventRepeat?: boolean
}

/**
 * Callback invoked for every key event.
 *
 * Receives the immutable {@link KeyEvent} snapshot plus the native
 * `KeyboardEvent` as an escape hatch (e.g. for `preventDefault()`).
 */
export type KeyHandler = (event: KeyEvent, native: KeyboardEvent) => void

/** Removes the listeners registered by {@link onKey} or {@link hotkey}. */
export type Unsubscribe = () => void
