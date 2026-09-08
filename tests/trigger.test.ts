import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../electron/types'

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (encoding: string) => void }
  stdin: { end: () => void }
  kill: () => void
}

const mocks = vi.hoisted(() => {
  const spawned: FakeChild[] = []
  return {
    spawned,
    globalShortcut: {
      register: vi.fn(() => true),
      unregisterAll: vi.fn()
    },
    spawn: vi.fn(() => {
      const child = new EventEmitter() as FakeChild
      const stdout = new EventEmitter() as FakeChild['stdout']
      stdout.setEncoding = vi.fn()
      child.stdout = stdout
      child.stdin = { end: vi.fn() }
      child.kill = vi.fn()
      spawned.push(child)
      return child
    })
  }
})

vi.mock('electron', () => ({ globalShortcut: mocks.globalShortcut }))
vi.mock('node:child_process', () => ({ spawn: mocks.spawn }))

describe('global recording trigger', () => {
  it('registers a configurable keyboard accelerator', async () => {
    const { GlobalTriggerManager } = await import('../electron/input/trigger')
    const onTrigger = vi.fn()
    const manager = new GlobalTriggerManager(onTrigger, 'C:/hook.exe')

    expect(
      manager.update({
        ...DEFAULT_SETTINGS,
        triggerType: 'keyboard',
        hotkey: 'CommandOrControl+Shift+R'
      })
    ).toBe(true)
    expect(mocks.globalShortcut.register).toHaveBeenCalledWith(
      'CommandOrControl+Shift+R',
      expect.any(Function)
    )
    manager.dispose()
  })

  it('spawns the native hook for the mouse button and fires only on "trigger"', async () => {
    const { GlobalTriggerManager } = await import('../electron/input/trigger')
    const onTrigger = vi.fn()
    const manager = new GlobalTriggerManager(onTrigger, 'C:/hook.exe')
    manager.update({ ...DEFAULT_SETTINGS, triggerType: 'mouse', mouseButton: 4 })

    expect(mocks.spawn).toHaveBeenCalledWith(
      'C:/hook.exe',
      ['4'],
      expect.objectContaining({ windowsHide: true })
    )
    const child = mocks.spawned[mocks.spawned.length - 1]
    child.stdout.emit('data', 'ready:4\n') // status line, ignored
    child.stdout.emit('data', 'trigger\n') // the swallowed button press
    expect(onTrigger).toHaveBeenCalledOnce()

    manager.dispose()
    expect(child.stdin.end).toHaveBeenCalled()
    expect(child.kill).toHaveBeenCalled()
  })
})
