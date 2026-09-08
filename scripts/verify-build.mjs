import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const required = [
  'out/main/main.js',
  'out/preload/preload.mjs',
  'out/renderer/index.html'
]

for (const relative of required) await access(resolve(root, relative))

const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
if (packageJson.main !== './out/main/main.js') {
  throw new Error(`package.json main does not match the built entry: ${packageJson.main}`)
}

const mainBundle = await readFile(resolve(root, 'out/main/main.js'), 'utf8')
if (!mainBundle.includes('../preload/preload.mjs')) {
  throw new Error('The main bundle does not reference the built preload entry.')
}

const html = await readFile(resolve(root, 'out/renderer/index.html'), 'utf8')
if (!html.includes('<title>Octa</title>') || !html.includes('/assets/')) {
  throw new Error('The renderer output is incomplete.')
}

console.log('Octa build artifacts verified.')
