import { useEffect, useRef } from 'react'
import { VoiceMicrophoneRecorder } from '../audio/voice-recorder'

export function VoiceInputBridge({ enabled }: { enabled: boolean }): React.JSX.Element | null {
  const recorder = useRef<VoiceMicrophoneRecorder | null>(null)

  useEffect(() => {
    if (!enabled) return
    const next = new VoiceMicrophoneRecorder()
    recorder.current = next
    void next.start((pcm) => window.octa.voice.pcm(pcm)).catch((error: unknown) => {
      window.octa.voice.microphoneError(error instanceof Error ? error.message : String(error))
    })
    return () => {
      recorder.current = null
      void next.stop()
    }
  }, [enabled])

  return null
}
