import { execFileSync, spawnSync } from 'node:child_process'

const secretPatterns = [
  ['Google AI Studio key', /\bAIza[0-9A-Za-z_-]{20,}\b/],
  ['Brave Search key', /\bBSA[0-9A-Za-z_-]{20,}\b/],
  ['Groq key', /\bgsk_[0-9A-Za-z_-]{20,}\b/],
  ['OpenAI key', /\bsk-(?:proj-)?[0-9A-Za-z_-]{20,}\b/],
  ['Anthropic key', /\bsk-ant-[0-9A-Za-z_-]{20,}\b/],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z_]{20,}\b|\bgithub_pat_[0-9A-Za-z_]{20,}\b/],
  ['Private key', /-----BEGIN [A-Z0-9 ]+ PRIVATE KEY-----/],
  ['Credential assignment', /\b(?:geminiApiKey|groqApiKey|braveSearchApiKey|ntfyTopic|GEMINI_API_KEY|GROQ_API_KEY|BRAVE_SEARCH_API_KEY|NTFY_TOPIC)\b\s*[:=]\s*["']?[^\s#"']{16,}/i]
]

function stagedPatch() {
  try {
    return execFileSync('git', ['diff', '--cached', '--no-ext-diff', '--unified=0', '--binary'], { encoding: 'utf8' })
  } catch (error) {
    console.error('Octa pre-commit: unable to read the staged diff.')
    process.exitCode = 1
    return ''
  }
}

function addedLines(patch) {
  const entries = []
  let file = '(unknown file)'
  for (const [index, line] of patch.split(/\r?\n/).entries()) {
    if (line.startsWith('+++ b/')) file = line.slice('+++ b/'.length)
    if (line.startsWith('+') && !line.startsWith('+++')) entries.push({ file, line: index + 1, text: line.slice(1) })
  }
  return entries
}

function scanAddedLines(entries) {
  const findings = []
  for (const entry of entries) {
    for (const [name, pattern] of secretPatterns) {
      if (pattern.test(entry.text)) findings.push({ ...entry, name })
    }
  }
  return findings
}

function runGitleaksIfAvailable(patch) {
  const executable = process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks'
  const help = spawnSync(executable, ['--help'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const helpText = `${help.stdout ?? ''}\n${help.stderr ?? ''}`
  if (help.error) return true
  const args = helpText.includes('protect')
    ? ['protect', '--staged', '--redact', '--config', '.gitleaks.toml']
    : helpText.includes('stdin')
      ? ['stdin', '--redact', '--config', '.gitleaks.toml']
      : null
  if (!args) return true
  const result = spawnSync(executable, args, args[0] === 'stdin'
    ? { input: patch, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
    : { stdio: 'inherit' })
  if (result.error) return true
  return result.status === 0
}

const patch = stagedPatch()
const entries = addedLines(patch)
const findings = scanAddedLines(entries)
if (findings.length > 0) {
  console.error('Octa pre-commit blocked: a staged addition looks like a secret.')
  for (const finding of findings) console.error(`- ${finding.name} in ${finding.file} (patch line ${finding.line})`)
  process.exit(1)
}

if (!runGitleaksIfAvailable(patch)) {
  console.error('Octa pre-commit blocked: Gitleaks found a secret in the staged changes.')
  process.exit(1)
}

console.log('Octa pre-commit: secret scan passed.')
