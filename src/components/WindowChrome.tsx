import { useEffect, useState } from 'react'
import type { Locale } from '../i18n'

interface WindowChromeProps {
  locale: Locale
  children: React.ReactNode
}

/** macOS-style window: rounded, padded, with traffic-light controls and a draggable title bar. */
export function WindowChrome({ locale, children }: WindowChromeProps): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)
  const [focused, setFocused] = useState(true)

  useEffect(() => {
    let active = true
    const api = typeof window !== 'undefined' ? window.octa?.window : undefined
    if (!api) return
    void api.state().then((state) => {
      if (!active) return
      setMaximized(state.maximized)
      setFocused(state.focused)
    }).catch(() => {})
    const off = api.onState((state) => {
      setMaximized(state.maximized)
      setFocused(state.focused)
    })
    return () => {
      active = false
      off()
    }
  }, [])

  const labels = locale === 'ar'
    ? { close: 'إغلاق', minimize: 'تصغير', zoom: maximized ? 'استعادة' : 'تكبير', title: 'أوكتا' }
    : { close: 'Close', minimize: 'Minimize', zoom: maximized ? 'Restore' : 'Zoom', title: 'Octa' }

  return (
    <div className={`mac-window ${maximized ? 'is-maximized' : ''} ${focused ? '' : 'is-blurred'}`}>
      <header className="mac-titlebar" onDoubleClick={() => window.octa?.window.maximize()}>
        <div className="traffic-lights" dir="ltr">
          <button className="traffic-light close" type="button" aria-label={labels.close} title={labels.close} onClick={() => window.octa?.window.close()}>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
          </button>
          <button className="traffic-light minimize" type="button" aria-label={labels.minimize} title={labels.minimize} onClick={() => window.octa?.window.minimize()}>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7" /></svg>
          </button>
          <button className="traffic-light zoom" type="button" aria-label={labels.zoom} title={labels.zoom} onClick={() => window.octa?.window.maximize()}>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 7.5V9h1.5M9 4.5V3H7.5M3 9l3-3M9 3L6 6" /></svg>
          </button>
        </div>
        <span className="mac-title">{labels.title}</span>
        <span className="mac-titlebar-spacer" aria-hidden="true" />
      </header>
      <div className="mac-window-body">{children}</div>
    </div>
  )
}
