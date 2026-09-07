import type { OctaApi } from '../electron/preload'

declare global {
  interface Window {
    octa: OctaApi
  }
}

export {}
