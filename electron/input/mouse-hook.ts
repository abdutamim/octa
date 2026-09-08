import { spawn, type ChildProcess } from 'node:child_process'

const RETRIGGER_GUARD_MS = 350

// Drives the native WH_MOUSE_LL helper (native/mouse-hook). The helper swallows
// the configured mouse button's OS-level action (so Back/Forward no longer
// navigate) and prints "trigger" on stdout. Runs as a child process, so a crash
// in the global hook can never take down the app; it exits when we close stdin.
export class NativeMouseHook {
  private child: ChildProcess | undefined
  private button: number | undefined
  private lastTrigger = 0

  constructor(
    private readonly exePath: string,
    private readonly onTrigger: () => void
  ) {}

  start(button: number): boolean {
    if (this.child && this.button === button) return true
    this.stop()
    this.button = button
    try {
      const child = spawn(this.exePath, [String(button)], { windowsHide: true })
      child.stdout?.setEncoding('utf8')
      let buffer = ''
      child.stdout?.on('data', (chunk: string) => {
        buffer += chunk
        let newline = buffer.indexOf('\n')
        while (newline >= 0) {
          const line = buffer.slice(0, newline).trim()
          buffer = buffer.slice(newline + 1)
          if (line === 'trigger') this.fire()
          newline = buffer.indexOf('\n')
        }
      })
      const forget = (): void => {
        if (this.child === child) this.child = undefined
      }
      child.on('exit', forget)
      child.on('error', forget)
      this.child = child
      return true
    } catch {
      this.child = undefined
      this.button = undefined
      return false
    }
  }

  private fire(): void {
    const now = Date.now()
    if (now - this.lastTrigger < RETRIGGER_GUARD_MS) return
    this.lastTrigger = now
    this.onTrigger()
  }

  stop(): void {
    const child = this.child
    this.child = undefined
    this.button = undefined
    if (!child) return
    try {
      child.stdin?.end()
      child.kill()
    } catch {
      // best effort
    }
  }

  dispose(): void {
    this.stop()
  }
}
