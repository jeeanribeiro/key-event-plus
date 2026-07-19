/**
 * Captures docs/assets/visualizer.png from the built demo (demo/dist).
 *
 * Serves the build with vite preview (port 43111), drives a real Chromium
 * keyboard through the page, verifies the library reacted, and screenshots
 * the result. Run with: pnpm capture
 */
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { preview } from 'vite'

const server = await preview({ root: 'demo' })
const url = server.resolvedUrls.local[0]
console.log(`preview at ${url}`)

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 940 },
  deviceScaleFactor: 2,
})

const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForSelector('#keyboard .key')

// Fill the log and light the board with a real typed sequence.
await page.locator('body').click()
for (const ch of ['k', 'e', 'y', 'e', 'v', 'e', 'n', 't']) {
  await page.keyboard.press(ch.toUpperCase() === ch ? ch : `Key${ch.toUpperCase()}`)
  await page.waitForTimeout(45)
}

// Fire the hotkey (mod+shift+k) so the toast and counter show.
await page.keyboard.press('Control+Shift+KeyK')
await page.waitForTimeout(120)

// Hold a chord so caps and modifier chips are lit in the shot.
await page.keyboard.down('Shift')
await page.keyboard.down('KeyF')
await page.keyboard.down('KeyJ')
await page.waitForTimeout(250)

const eventCount = Number(await page.locator('#event-count').textContent())
const hotkeyCount = Number(await page.locator('#hotkey-count').textContent())
const litKeys = await page.locator('#keyboard .key.down').count()
const toastShown = await page.locator('#toast.show').count()

await mkdir('docs/assets', { recursive: true })
await page.screenshot({ path: 'docs/assets/visualizer.png' })

await page.keyboard.up('KeyJ')
await page.keyboard.up('KeyF')
await page.keyboard.up('Shift')
await browser.close()
await new Promise((resolve, reject) => {
  server.httpServer.close((err) => (err ? reject(err) : resolve()))
})

console.log({ eventCount, hotkeyCount, litKeys, toastShown, errors })
if (errors.length > 0) throw new Error(`page errors: ${errors.join(' | ')}`)
if (!(eventCount >= 17)) throw new Error(`expected >=17 events, saw ${eventCount}`)
if (hotkeyCount !== 1) throw new Error(`expected hotkey to fire once, saw ${hotkeyCount}`)
if (litKeys < 2) throw new Error(`expected held keys to be lit, saw ${litKeys}`)
if (toastShown !== 1) throw new Error('expected the hotkey toast to be visible')
console.log('captured docs/assets/visualizer.png')
