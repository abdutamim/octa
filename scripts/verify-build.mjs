import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
for (const relative of ['out/main/main.js', 'out/preload/preload.mjs', 'out/renderer/index.html']) {
  await access(resolve(root, relative))
}

const html = await readFile(resolve(root, 'out/renderer/index.html'), 'utf8')
if (!html.includes('Octa Assistant') || !html.includes('/assets/')) {
  throw new Error('The renderer output is incomplete.')
}

console.log('Octa build artifacts verified.')
