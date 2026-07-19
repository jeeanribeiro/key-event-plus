import './style.css'
import { getLayoutMap, hotkey, keyForCode, onKey, supportsLayoutMap } from 'key-event-plus'
import type { KeyEvent } from 'key-event-plus'

/* ------------------------------------------------------------------ *
 * On-screen keyboard (ANSI main block), sized in key units.
 * ------------------------------------------------------------------ */

interface KeyDef {
  code: string
  label: string
  u: number
}

const k = (code: string, label: string, u = 1): KeyDef => ({ code, label, u })

const ROWS: KeyDef[][] = [
  [
    k('Backquote', '`'),
    k('Digit1', '1'),
    k('Digit2', '2'),
    k('Digit3', '3'),
    k('Digit4', '4'),
    k('Digit5', '5'),
    k('Digit6', '6'),
    k('Digit7', '7'),
    k('Digit8', '8'),
    k('Digit9', '9'),
    k('Digit0', '0'),
    k('Minus', '-'),
    k('Equal', '='),
    k('Backspace', '⌫', 2),
  ],
  [
    k('Tab', '⇥', 1.5),
    k('KeyQ', 'Q'),
    k('KeyW', 'W'),
    k('KeyE', 'E'),
    k('KeyR', 'R'),
    k('KeyT', 'T'),
    k('KeyY', 'Y'),
    k('KeyU', 'U'),
    k('KeyI', 'I'),
    k('KeyO', 'O'),
    k('KeyP', 'P'),
    k('BracketLeft', '['),
    k('BracketRight', ']'),
    k('Backslash', '\\', 1.5),
  ],
  [
    k('CapsLock', 'caps', 1.75),
    k('KeyA', 'A'),
    k('KeyS', 'S'),
    k('KeyD', 'D'),
    k('KeyF', 'F'),
    k('KeyG', 'G'),
    k('KeyH', 'H'),
    k('KeyJ', 'J'),
    k('KeyK', 'K'),
    k('KeyL', 'L'),
    k('Semicolon', ';'),
    k('Quote', "'"),
    k('Enter', '⏎', 2.25),
  ],
  [
    k('ShiftLeft', '⇧', 2.25),
    k('KeyZ', 'Z'),
    k('KeyX', 'X'),
    k('KeyC', 'C'),
    k('KeyV', 'V'),
    k('KeyB', 'B'),
    k('KeyN', 'N'),
    k('KeyM', 'M'),
    k('Comma', ','),
    k('Period', '.'),
    k('Slash', '/'),
    k('ShiftRight', '⇧', 2.75),
  ],
  [
    k('ControlLeft', 'ctrl', 1.25),
    k('MetaLeft', '◆', 1.25),
    k('AltLeft', 'alt', 1.25),
    k('Space', '', 6.25),
    k('AltRight', 'alt', 1.25),
    k('MetaRight', '◆', 1.25),
    k('ContextMenu', '☰', 1.25),
    k('ControlRight', 'ctrl', 1.25),
  ],
]

const $ = (sel: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(sel)
  if (!el) throw new Error(`missing element: ${sel}`)
  return el
}

const keyboard = $('#keyboard')
const caps = new Map<string, HTMLElement>()

for (const row of ROWS) {
  const rowEl = document.createElement('div')
  rowEl.className = 'kb-row'
  for (const def of row) {
    const cap = document.createElement('div')
    cap.className = 'key'
    cap.style.flexGrow = String(def.u)
    cap.textContent = def.label
    cap.dataset.code = def.code
    caps.set(def.code, cap)
    rowEl.append(cap)
  }
  keyboard.append(rowEl)
}

/* ------------------------------------------------------------------ *
 * Live wiring — everything below runs through the library itself.
 * ------------------------------------------------------------------ */

const logEl = $('#log')
const countEl = $('#event-count')
const chips = document.querySelectorAll<HTMLElement>('#mod-chips .chip')
let events = 0

const span = (className: string, text: string): HTMLSpanElement => {
  const el = document.createElement('span')
  el.className = className
  el.textContent = text
  return el
}

const renderLog = (e: KeyEvent) => {
  const li = document.createElement('li')
  const mods = Object.entries(e.modifiers)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join('+')
  li.append(
    span(e.state === 'down' ? 'st-down' : 'st-up', e.state === 'down' ? '▼ down' : '▲ up'),
    span('lk', `key ${JSON.stringify(e.key)}`),
    span('lc', `code ${e.code}`),
  )
  if (mods) li.append(span('lm', mods))
  if (e.repeat) li.append(span('lr', 'repeat'))
  logEl.prepend(li)
  while (logEl.children.length > 80) logEl.lastElementChild?.remove()
}

onKey((e) => {
  // keycap lighting
  const cap = caps.get(e.code)
  if (cap) {
    if (e.state === 'down') {
      cap.classList.remove('released')
      cap.classList.add('down')
    } else {
      cap.classList.remove('down')
      cap.classList.add('released')
      cap.addEventListener(
        'animationend',
        () => {
          cap.classList.remove('released')
        },
        { once: true },
      )
    }
  }

  // modifier chips reflect the immutable snapshot on the event
  for (const chip of chips) {
    const mod = chip.dataset.mod as keyof KeyEvent['modifiers']
    chip.classList.toggle('on', e.modifiers[mod])
  }

  events += 1
  countEl.textContent = String(events)
  renderLog(e)
})

/* hotkey demo ------------------------------------------------------- */

const isApple = /mac|iph|ipad|ipod/i.test(navigator.userAgent)
const modLabel = isApple ? '⌘' : 'Ctrl'
$('#hotkey-combo').innerHTML =
  `<span class="kbd">${modLabel}</span>+<span class="kbd">⇧</span>+<span class="kbd">K</span>`

const toast = $('#toast')
const hotkeyCount = $('#hotkey-count')
let fired = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

hotkey(
  'mod+shift+k',
  () => {
    fired += 1
    hotkeyCount.textContent = String(fired)
    toast.textContent = `hotkey fired — mod+shift+k ×${String(fired)}`
    toast.classList.add('show')
    for (const el of document.querySelectorAll('#hotkey-combo .kbd')) el.classList.add('lit')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.classList.remove('show')
      for (const el of document.querySelectorAll('#hotkey-combo .kbd')) el.classList.remove('lit')
    }, 1800)
  },
  { preventDefault: true },
)

/* layout awareness --------------------------------------------------- */

const layoutBadge = $('#layout-badge')
const layoutNote = $('#layout-note')

const initLayout = async () => {
  if (supportsLayoutMap()) {
    const map = await getLayoutMap()
    let relabeled = 0
    for (const [code, cap] of caps) {
      const key = map.get(code)
      if (
        key &&
        /^Key[A-Z]$|^Digit[0-9]$|^(?:Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(
          code,
        )
      ) {
        const label = key.length === 1 ? key.toUpperCase() : key
        if (cap.textContent !== label) {
          cap.textContent = label
          relabeled += 1
        }
      }
    }
    layoutBadge.innerHTML =
      `<span class="text-green">●</span> Keyboard Layout Map API active — legends match your layout` +
      (relabeled > 0 ? ` (${String(relabeled)} keys relabeled)` : ' (QWERTY detected)')
    const y = await keyForCode('KeyY')
    layoutNote.innerHTML =
      `<code class="text-cyan">keyForCode('KeyY')</code> resolved to ` +
      `<code class="text-amber">${JSON.stringify(y)}</code> on your layout via ` +
      `<code class="text-cyan">navigator.keyboard.getLayoutMap()</code>.`
  } else {
    layoutBadge.innerHTML =
      `<span class="text-amber">●</span> Layout Map API unavailable here — showing QWERTY legends. ` +
      `Events still carry your layout's real <code>key</code> values.`
    layoutNote.innerHTML =
      `This browser has no <code class="text-cyan">getLayoutMap()</code>; ` +
      `<code class="text-cyan">keyForCode()</code> falls back to deriving letters and digits ` +
      `from the physical code.`
  }
}

void initLayout()
