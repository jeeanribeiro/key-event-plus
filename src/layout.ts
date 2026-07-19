interface KeyboardLayoutMap {
  getLayoutMap(): Promise<ReadonlyMap<string, string>>
}

interface NavigatorWithKeyboard extends Navigator {
  keyboard?: KeyboardLayoutMap
}

const keyboard = (): KeyboardLayoutMap | undefined =>
  typeof navigator === 'undefined' ? undefined : (navigator as NavigatorWithKeyboard).keyboard

/** Whether `navigator.keyboard.getLayoutMap()` is available (Chromium-based browsers). */
export const supportsLayoutMap = (): boolean => !!keyboard()?.getLayoutMap

/**
 * The full physical-code → key mapping for the user's active layout.
 *
 * Uses the Keyboard Layout Map API where available; resolves to an empty map
 * elsewhere (Firefox, Safari, SSR) so callers can treat it uniformly.
 */
export async function getLayoutMap(): Promise<ReadonlyMap<string, string>> {
  const kb = keyboard()
  return kb?.getLayoutMap ? kb.getLayoutMap() : new Map()
}

/**
 * Resolve the character a physical key produces on the user's active layout.
 *
 * `keyForCode('KeyY')` resolves to `"y"` on QWERTY, `"z"` on QWERTZ, `"н"` on
 * ЙЦУКЕН. Where the Keyboard Layout Map API is unavailable, falls back to
 * deriving from the code for `KeyA`–`KeyZ` and `Digit0`–`Digit9`, and returns
 * `undefined` for anything else.
 */
export async function keyForCode(code: string): Promise<string | undefined> {
  const mapped = (await getLayoutMap()).get(code)
  if (mapped) return mapped
  const m = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(code)
  return m ? (m[1]?.toLowerCase() ?? m[2]) : undefined
}
