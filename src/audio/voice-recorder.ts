const TARGET_SAMPLE_RATE = 16_000

export type VoicePcmListener = (pcm: ArrayBuffer, level: number) => void

interface VoiceCaptureSession {
  stream: MediaStream
  context: AudioContext
  source: MediaStreamAudioSourceNode
  processor: ScriptProcessorNode
  mute: GainNode
}

function release(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop()
}

function resample(input: Float32Array, sourceRate: number): Float32Array {
  if (sourceRate === TARGET_SAMPLE_RATE) return input
  const length = Math.max(1, Math.round(input.length * TARGET_SAMPLE_RATE / sourceRate))
  const output = new Float32Array(length)
  const scale = (input.length - 1) / Math.max(1, length - 1)
  for (let index = 0; index < length; index += 1) {
    const position = index * scale
    const left = Math.floor(position)
    const right = Math.min(input.length - 1, left + 1)
    const fraction = position - left
    output[index] = input[left] * (1 - fraction) + input[right] * fraction
  }
  return output
}

function pcm16(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length)
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]))
    output[index] = sample < 0 ? Math.round(sample * 32_768) : Math.round(sample * 32_767)
  }
  return output.buffer
}

function level(input: Float32Array): number {
  if (input.length === 0) return 0
  let sum = 0
  for (const sample of input) sum += sample * sample
  return Math.min(1, Math.sqrt(sum / input.length) * 12)
}

/** Captures mono PCM locally and hands frames to the isolated main-process bridge. */
export class VoiceMicrophoneRecorder {
  private session: VoiceCaptureSession | undefined
  private generation = 0

  async start(listener: VoicePcmListener): Promise<void> {
    if (this.session) return
    const generation = ++this.generation
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    })
    if (generation !== this.generation) {
      release(stream)
      return
    }
    const context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE, latencyHint: 'interactive' })
    await context.resume()
    if (generation !== this.generation) {
      release(stream)
      await context.close()
      return
    }
    const source = context.createMediaStreamSource(stream)
    const processor = context.createScriptProcessor(2_048, 1, 1)
    const mute = context.createGain()
    mute.gain.value = 0
    const session = { stream, context, source, processor, mute }
    processor.onaudioprocess = (event) => {
      if (this.session !== session) return
      const input = event.inputBuffer.getChannelData(0)
      listener(pcm16(resample(input, context.sampleRate)), level(input))
    }
    source.connect(processor)
    processor.connect(mute)
    mute.connect(context.destination)
    this.session = session
  }

  async stop(): Promise<void> {
    this.generation += 1
    const session = this.session
    this.session = undefined
    if (!session) return
    session.processor.disconnect()
    session.source.disconnect()
    release(session.stream)
    await session.context.close()
  }
}
