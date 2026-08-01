export const AXIOM_CORE_AUDIO_CUES = {
  ambient: {
    id: "AX-AUD-001",
    frequencies: [55, 82.5],
    gain: 0.012,
    duration: null,
    sweep: 1,
  },
  thinking: {
    id: "AX-AUD-002",
    frequencies: [528, 792],
    gain: 0.028,
    duration: 0.45,
    sweep: 1.18,
  },
  action: {
    id: "AX-AUD-003",
    frequencies: [660, 990],
    gain: 0.022,
    duration: 0.18,
    sweep: 1.12,
  },
} as const;

export type AxiomCoreAudioCue = keyof typeof AXIOM_CORE_AUDIO_CUES;

export class AxiomCoreAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private ambient: OscillatorNode[] = [];
  private muted = false;

  async unlock(): Promise<boolean> {
    if (!this.context) {
      const AudioContextConstructor = globalThis.AudioContext;
      if (!AudioContextConstructor) return false;
      this.context = new AudioContextConstructor();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.master.gain.setValueAtTime(this.muted ? 0 : 1, this.context.currentTime);
    }

    if (this.context.state === "suspended") await this.context.resume();
    if (this.ambient.length === 0) this.schedule("ambient");
    return true;
  }

  play(cue: AxiomCoreAudioCue): boolean {
    if (!this.context || !this.master) return false;
    if (cue === "ambient" && this.ambient.length > 0) return true;
    this.schedule(cue);
    return true;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.master?.gain.setValueAtTime(muted ? 0 : 1, this.context?.currentTime ?? 0);
  }

  async dispose(): Promise<void> {
    this.ambient.forEach((oscillator) => oscillator.stop());
    this.ambient = [];
    if (this.context && this.context.state !== "closed") await this.context.close();
    this.context = undefined;
    this.master = undefined;
  }

  private schedule(cueName: AxiomCoreAudioCue): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const cue = AXIOM_CORE_AUDIO_CUES[cueName];
    const gain = context.createGain();
    const start = context.currentTime;
    gain.gain.setValueAtTime(cue.duration === null ? cue.gain : 0.0001, start);
    gain.connect(master);

    if (cue.duration !== null) {
      gain.gain.linearRampToValueAtTime(cue.gain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + cue.duration);
    }

    for (const frequency of cue.frequencies) {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.connect(gain);
      oscillator.start(start);

      if (cue.duration === null) {
        this.ambient.push(oscillator);
      } else {
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency * cue.sweep,
          start + cue.duration,
        );
        oscillator.stop(start + cue.duration);
      }
    }
  }
}
