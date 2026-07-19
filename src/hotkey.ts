import { onKey } from './on-key'
import type { KeyEvent, KeyHandler, OnKeyOptions, Unsubscribe } from './types'

/** Options accepted by {@link hotkey}. */
export interface HotkeyOptions extends OnKeyOptions {
  /** Call `preventDefault()` on the native event when the combo matches. Defaults to `false`. */
  preventDefault?: boolean
}

interface Combo {
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
  key: string
  /** Physical-position fallback (`keyk` / `digit1`); empty when not applicable. */
  code: string
}

/** Host-object view of `navigator` — fields are optional across runtimes. */
interface PlatformNavigator {
  platform?: string
  userAgent?: string
  userAgentData?: { platform?: string }
}

/** `mod` resolves to ⌘ on Apple platforms and Ctrl everywhere else. */
const isMac = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as PlatformNavigator
  // First non-empty signal wins: UA-CH platform, then legacy platform, then UA string.
  const platform = [nav.userAgentData?.platform, nav.platform, nav.userAgent].find(Boolean) ?? ''
  return /mac|iph|ipad|ipod/i.test(platform)
}

const ALIASES: Record<string, string> = {
  esc: 'escape',
  space: ' ',
  plus: '+',
  return: 'enter',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
}

type ModName = 'alt' | 'ctrl' | 'meta' | 'shift'

const MODS: Record<string, ModName> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  win: 'meta',
}

const parse = (combo: string): Combo => {
  const c: Combo = { alt: false, ctrl: false, meta: false, shift: false, key: '', code: '' }
  for (const raw of combo.toLowerCase().split('+')) {
    const token = raw.trim()
    const mod = token === 'mod' ? (isMac() ? 'meta' : 'ctrl') : MODS[token]
    if (mod) c[mod] = true
    else c.key = ALIASES[token] ?? token
  }
  if (!c.key) throw new Error(`hotkey: "${combo}" needs one non-modifier key`)
  // Physical-position fallback for single letters and digits, so "mod+k"
  // still fires when the active layout produces a different character
  // (e.g. "л" on Cyrillic layouts).
  if (/^[a-z]$/.test(c.key)) c.code = `key${c.key}`
  else if (/^[0-9]$/.test(c.key)) c.code = `digit${c.key}`
  return c
}

const matches = (c: Combo, e: KeyEvent): boolean => {
  const m = e.modifiers
  return (
    m.alt === c.alt &&
    m.ctrl === c.ctrl &&
    m.meta === c.meta &&
    m.shift === c.shift &&
    (e.key.toLowerCase() === c.key || (c.code !== '' && e.code.toLowerCase() === c.code))
  )
}

/**
 * Run `handler` when a key combo like `"mod+shift+k"` is pressed.
 *
 * - `mod` means ⌘ on macOS/iOS and Ctrl everywhere else.
 * - Modifier tokens: `ctrl`/`control`, `alt`/`option`, `shift`, `meta`/`cmd`/`command`/`super`/`win`.
 * - Key aliases: `esc`, `space`, `plus`, `return`, `up`, `down`, `left`, `right`.
 * - Modifiers must match exactly — `mod+k` does not fire on `mod+shift+k`.
 * - Letters and digits also match by physical key position, so combos keep
 *   working on non-Latin layouts.
 *
 * Fires on `keydown` only. Returns an {@link Unsubscribe}.
 */
export function hotkey(
  combo: string,
  handler: KeyHandler,
  options: HotkeyOptions = {},
): Unsubscribe {
  const parsed = parse(combo)
  return onKey((event, native) => {
    if (event.state !== 'down' || !matches(parsed, event)) return
    if (options.preventDefault) native.preventDefault()
    handler(event, native)
  }, options)
}
