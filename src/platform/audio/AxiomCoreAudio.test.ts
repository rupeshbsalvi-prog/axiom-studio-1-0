import { afterEach, describe, expect, it, vi } from "vitest";
import { AXIOM_CORE_AUDIO_CUES, AxiomCoreAudio } from "./AxiomCoreAudio";

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((value: number) => { this.value = value; });
  linearRampToValueAtTime = vi.fn((value: number) => { this.value = value; });
  exponentialRampToValueAtTime = vi.fn((value: number) => { this.value = value; });
  cancelScheduledValues = vi.fn();
}

class MockAudioContext {
  currentTime = 1;
  state: AudioContextState = "suspended";
  destination = {} as AudioDestinationNode;
  oscillators: Array<{ frequency: MockAudioParam; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }> = [];
  masterGain = { gain: new MockAudioParam(), connect: vi.fn() };
  resume = vi.fn(async () => { this.state = "running"; });
  close = vi.fn(async () => { this.state = "closed"; });
  createGain = vi.fn()
    .mockImplementationOnce(() => this.masterGain as unknown as GainNode)
    .mockImplementation(() => ({ gain: new MockAudioParam(), connect: vi.fn() }) as unknown as GainNode);
  createOscillator = vi.fn(() => {
    const oscillator = {
      type: "sine",
      frequency: new MockAudioParam(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  });
}

describe("Axiom Core audio identity", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("defines the three production cue identities", () => {
    expect(Object.values(AXIOM_CORE_AUDIO_CUES).map((cue) => cue.id)).toEqual([
      "AX-AUD-001",
      "AX-AUD-002",
      "AX-AUD-003",
    ]);
  });

  it("stays silent before unlock and schedules cues after a user gesture", async () => {
    const context = new MockAudioContext();
    vi.stubGlobal("AudioContext", class { constructor() { return context; } });
    const audio = new AxiomCoreAudio();

    expect(audio.play("action")).toBe(false);
    await audio.unlock();
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(2);
    await audio.unlock();
    expect(context.oscillators).toHaveLength(2);
    expect(audio.play("ambient")).toBe(true);
    expect(context.oscillators).toHaveLength(2);
    expect(audio.play("thinking")).toBe(true);
    expect(context.oscillators).toHaveLength(4);

    audio.setMuted(true);
    expect(context.masterGain.gain.value).toBe(0);
    await audio.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    await audio.dispose();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it("fails closed without browser audio and preserves pre-unlock mute", async () => {
    const unsupported = new AxiomCoreAudio();
    expect(await unsupported.unlock()).toBe(false);

    const context = new MockAudioContext();
    vi.stubGlobal("AudioContext", class { constructor() { return context; } });
    const muted = new AxiomCoreAudio();
    muted.setMuted(true);
    expect(await muted.unlock()).toBe(true);
    expect(context.masterGain.gain.value).toBe(0);
    await muted.dispose();
  });
});
