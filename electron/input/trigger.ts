import { globalShortcut } from 'electron'
import type { AppSettings } from '../types'
import { NativeMouseHook } from './mouse-hook'

export class GlobalTriggerManager {
  private readonly mouseHook: NativeMouseHook

  constructor(
    private readonly onTrigger: () => void,
    mouseHookExePath: string,
    private readonly onInboxTrigger?: () => void
  ) {
    this.mouseHook = new NativeMouseHook(mouseHookExePath, onTrigger)
  }

  update(settings: AppSettings): boolean {
    globalShortcut.unregisterAll()
    const inboxRegistered = this.onInboxTrigger
      ? globalShortcut.register('CommandOrControl+Alt+Shift+Space', this.onInboxTrigger)
      : true

    if (!settings.pushToTalkEnabled) {
      this.mouseHook.stop()
      return inboxRegistered
    }

    if (settings.triggerType === 'mouse') {
      return this.mouseHook.start(settings.mouseButton) && inboxRegistered
    }

    this.mouseHook.stop()
    const accelerator = settings.hotkey.trim() || settings.pushToTalkKey.trim()
    return Boolean(accelerator) && globalShortcut.register(accelerator, this.onTrigger) && inboxRegistered
  }

  dispose(): void {
    globalShortcut.unregisterAll()
    this.mouseHook.dispose()
  }
}
