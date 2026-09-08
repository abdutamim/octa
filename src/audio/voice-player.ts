function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function sampleRate(mimeType: string): number {
  const rate = mimeType.match(/rate=(\d+)/i)
  return rate ? Number(rate[1]) : 24_000
}

export class VoiceAudioPlayer {
  private context: AudioContext | undefined
  private nextStart = 0
  private readonly sources = new Set<AudioBufferSourceNode>()

  private getContext(): AudioContext {
    this.context ??= new AudioContext({ latencyHint: 'interactive' })
    return this.context
  }

  async play(data: string, mimeType: string): Promise<void> {
    const context = this.getContext()
    await context.resume()
    const bytes = decodeBase64(data)
    let buffer: AudioBuffer
    if (/pcm|l16/i.test(mimeType)) {
      const raw = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2))
      buffer = context.createBuffer(1, raw.length, sampleRate(mimeType))
      const channel = buffer.getChannelData(0)
      for (let index = 0; index < raw.length; index += 1) channel[index] = raw[index] / 32_768
    } else {
      const copy = bytes.slice().buffer
      buffer = await context.decodeAudioData(copy)
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    this.sources.add(source)
    source.addEventListener('ended', () => this.sources.delete(source), { once: true })
    const start = Math.max(context.currentTime, this.nextStart)
    source.start(start)
    this.nextStart = start + buffer.duration
  }

  stop(): void {
    for (const source of this.sources) {
      try {
        source.stop()
      } catch {
        // A source that has already ended is safe to ignore.
      }
    }
    this.sources.clear()
    this.nextStart = 0
  }

  async dispose(): Promise<void> {
    this.stop()
    await this.context?.close()
    this.context = undefined
  }
}
