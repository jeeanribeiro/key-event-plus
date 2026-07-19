# Migrating from v1 to v2

v2 is a full rewrite. The v1 API — `keyEventListener(ms, callback)` — was a `setTimeout`
polling loop with a handful of structural problems that v2 removes outright:

| v1 problem                                                               | v2 behavior                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| Polling every `ms` coalesced or dropped keystrokes between ticks         | Event-driven `keydown`/`keyup` — every event is delivered |
| Listened to the deprecated `keypress` event                              | `KeyboardEvent.key`/`.code` semantics only                |
| Mutated and reused **one shared object** across all callback invocations | Fresh, deeply frozen `KeyEvent` per emission              |
| No way to stop — listeners and the timer ran forever                     | `onKey()`/`hotkey()` return an unsubscribe function       |
| CommonJS only, no types                                                  | Dual ESM/CJS with strict TypeScript types                 |
| Crashed without a DOM                                                    | SSR-safe no-ops                                           |

## Call-site changes

### Before (v1)

```js
var keyEventListener = require('key-event-plus')

window.onload = function () {
  keyEventListener(20, (keyEvent) => {
    console.log(keyEvent.key, keyEvent.state)
  })
}
```

### After (v2)

```ts
import { onKey } from 'key-event-plus'

const off = onKey((event) => {
  console.log(event.key, event.state)
})
```

Point by point:

- **Drop the `ms` argument.** There is no polling interval anymore; events arrive as they
  happen. There is nothing to tune.
- **`keyEvent.key` and `keyEvent.state` still exist** and mean the same thing (`state` is
  still `'down' | 'up'`), so most callback bodies work unchanged.
- **New fields:** `event.code` (physical key), `event.repeat` (auto-repeat flag) and
  `event.modifiers` (`{ alt, ctrl, meta, shift }`).
- **Events are frozen.** If you mutated the callback object in v1 (e.g. as a shared scratchpad
  — which was actually v1's own internal behavior), copy it instead: `{ ...event }`.
- **You can stop listening now.** Keep the returned function and call it on teardown —
  important in SPAs and component lifecycles.
- **No `window.onload` dance needed.** Import and call at module scope; without a `window`
  (SSR) it is a safe no-op.

### Repeats

v1's polling loop reported a key at most once per tick, which accidentally hid auto-repeat.
v2 reports repeats honestly with `repeat: true`. If you want v1-ish "one event per physical
press" behavior:

```ts
onKey(handler, { preventRepeat: true })
```

### Shortcuts

If your v1 callback pattern-matched key combos by hand, `hotkey()` replaces it:

```ts
import { hotkey } from 'key-event-plus'

const off = hotkey('mod+shift+k', () => openPalette(), { preventDefault: true })
```

`mod` resolves to ⌘ on macOS and Ctrl elsewhere, and single letters/digits also match by
physical key position so the shortcut survives international layout switches.
