import { useEffect, useRef } from 'react'
import { VoiceAudioPlayer } from '../audio/voice-player'

export function VoiceAudioPlayback(): null {
  const player = useRef<VoiceAudioPlayer | null>(null)

  useEffect(() => {
    const next = new VoiceAudioPlayer()
    player.current = next
    const removeAudio = window.octa.voice.onAudio((event) => {
      void next.play(event.data, event.mimeType).catch(() => undefined)
    })
    const removeStop = window.octa.voice.onAudioStop(() => next.stop())
    return () => {
      removeAudio()
      removeStop()
      void next.dispose()
      player.current = null
    }
  }, [])

  return null
}
