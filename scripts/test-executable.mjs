import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { spawn } from 'node:child_process'
import {
  access,
  open,
  readFile,
  readdir,
  stat,
  unlink,
  writeFile
} from 'node:fs/promises'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
// A separate validation directory lets us package and smoke-test while the
// user's installed tray app keeps running and locking its own executable.
const release = process.env.OCTA_RELEASE_DIR
  ? resolve(process.env.OCTA_RELEASE_DIR)
  : join(root, 'release')
const unpacked = join(release, 'win-unpacked')
const executable = join(unpacked, 'Octa Assistant.exe')
const smokeOutput = join(release, 'executable-smoke.json')

async function headerOf(path, length = 2) {
  const file = await open(path, 'r')
  try {
    const header = Buffer.alloc(length)
    const { bytesRead } = await file.read(header, 0, length, 0)
    if (bytesRead !== length) throw new Error(`File is truncated: ${path}`)
    return header.toString('ascii')
  } finally {
    await file.close()
  }
}

async function sha256(path) {
  return new Promise((resolveHash, rejectHash) => {
    const digest = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('data', (chunk) => digest.update(chunk))
    stream.on('error', rejectHash)
    stream.on('end', () => resolveHash(digest.digest('hex')))
  })
}

await access(executable)
if ((await headerOf(executable)) !== 'MZ') {
  throw new Error('Packaged application does not have a valid Windows PE header.')
}

const bundledModels = join(unpacked, 'resources', 'models')
if (await stat(bundledModels).then(() => true).catch(() => false)) {
  throw new Error('Cloud-only package unexpectedly contains local model files.')
}

await unlink(smokeOutput).catch(() => undefined)
await new Promise((resolveRun, rejectRun) => {
  const child = spawn(executable, ['--smoke-test', `--smoke-output=${smokeOutput}`], {
    windowsHide: true,
    stdio: 'pipe'
  })
  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })
  const timeout = setTimeout(() => {
    child.kill()
    rejectRun(new Error('Packaged executable smoke test timed out.'))
  }, 180_000)
  child.on('error', rejectRun)
  child.on('exit', (code) => {
    clearTimeout(timeout)
    if (code === 0) resolveRun()
    else rejectRun(new Error(`Packaged executable exited with ${code}.\n${stderr}`))
  })
})

const smoke = JSON.parse(await readFile(smokeOutput, 'utf8'))
if (!smoke.ok) throw new Error(`Packaged executable checks failed: ${(smoke.failures ?? []).join('; ')}`)

const files = await readdir(unpacked, { recursive: true, withFileTypes: true })
let packageBytes = 0
let packageFiles = 0
for (const entry of files) {
  if (!entry.isFile()) continue
  const path = join(entry.parentPath, entry.name)
  packageBytes += (await stat(path)).size
  packageFiles += 1
}

const executableStat = await stat(executable)
const verification = {
  verifiedAt: new Date().toISOString(),
  executable: {
    path: executable,
    bytes: executableStat.size,
    peHeader: 'MZ',
    sha256: await sha256(executable)
  },
  package: {
    path: unpacked,
    files: packageFiles,
    bytes: packageBytes,
    bundledModels: false
  },
  smoke
}

await writeFile(join(release, 'verification.json'), JSON.stringify(verification, null, 2))
console.log(JSON.stringify(verification, null, 2))
