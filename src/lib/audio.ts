/**
 * Central sound system. All effects are synthesized with the Web Audio API
 * (no external files, no licensing concerns) and routed through one master
 * gain so the teacher's volume / mute settings apply everywhere.
 */
export type SoundName =
  | "click"
  | "correct"
  | "wrong"
  | "tick"
  | "win"
  | "timeup"
  | "pop"
  | "wheelTick"
  | "engine"
  | "whoosh"
  | "levelUp";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.7;
  private sfxVolume = 1;
  private voiceVolume = 1;
  private muted = false;
  private voiceEnabled = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyGain();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private applyGain() {
    if (this.master && this.ctx) this.master.gain.setValueAtTime(this.muted ? 0 : this.volume * this.sfxVolume, this.ctx.currentTime);
  }

  /** volume = master; sfxVolume / voiceVolume scale effects and spoken phrases independently. */
  configure(opts: { volume?: number; muted?: boolean; voice?: boolean; sfxVolume?: number; voiceVolume?: number }) {
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    if (opts.volume !== undefined) this.volume = clamp01(opts.volume);
    if (opts.sfxVolume !== undefined) this.sfxVolume = clamp01(opts.sfxVolume);
    if (opts.voiceVolume !== undefined) this.voiceVolume = clamp01(opts.voiceVolume);
    if (opts.muted !== undefined) this.muted = opts.muted;
    if (opts.voice !== undefined) this.voiceEnabled = opts.voice;
    this.applyGain();
    if (this.muted && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }

  get isMuted() {
    return this.muted;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.3, freqEnd?: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(this.master!);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noise(start: number, dur: number, gain = 0.3, filterFreq = 1200) {
    const ctx = this.ctx!;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter).connect(g).connect(this.master!);
    src.start(start);
  }

  play(name: SoundName) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "click":
        this.tone(660, t, 0.07, "triangle", 0.15, 880);
        break;
      case "correct":
        [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, t + i * 0.09, 0.22, "triangle", 0.25));
        this.tone(1046.5, t + 0.27, 0.35, "sine", 0.18);
        break;
      case "wrong":
        this.tone(330, t, 0.18, "sine", 0.22, 260);
        this.tone(247, t + 0.17, 0.3, "sine", 0.2, 196);
        break;
      case "tick":
        this.tone(1200, t, 0.05, "square", 0.06);
        break;
      case "wheelTick":
        this.tone(1800, t, 0.025, "triangle", 0.08);
        break;
      case "timeup":
        this.tone(440, t, 0.25, "sawtooth", 0.08, 220);
        this.tone(330, t + 0.25, 0.4, "sawtooth", 0.08, 165);
        break;
      case "pop":
        this.noise(t, 0.12, 0.5, 1800);
        this.tone(900, t, 0.08, "sine", 0.2, 200);
        break;
      case "engine":
        this.tone(70, t, 0.9, "sawtooth", 0.06, 210);
        this.tone(105, t, 0.9, "square", 0.025, 300);
        break;
      case "whoosh":
        this.noise(t, 0.35, 0.18, 700);
        break;
      case "levelUp":
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + i * 0.07, 0.18, "triangle", 0.2));
        break;
      case "win": {
        const melody = [523.25, 523.25, 783.99, 659.25, 783.99, 1046.5];
        const times = [0, 0.12, 0.24, 0.48, 0.6, 0.78];
        melody.forEach((f, i) => this.tone(f, t + times[i], i === melody.length - 1 ? 0.7 : 0.2, "triangle", 0.22));
        melody.forEach((f, i) => this.tone(f / 2, t + times[i], 0.2, "sine", 0.1));
        break;
      }
    }
  }

  /**
   * Speaks a short Arabic encouragement with the device's Arabic voice, only
   * when the teacher enabled it and a natural Arabic voice is installed.
   */
  say(text: string) {
    if (this.muted || !this.voiceEnabled || this.voiceVolume === 0 || typeof speechSynthesis === "undefined") return;
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ar"));
    if (voices.length === 0) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voices.find((v) => /natural|neural|online|premium/i.test(v.name)) ?? voices[0];
    u.lang = u.voice.lang;
    u.rate = 0.95;
    u.pitch = 1.1;
    u.volume = this.volume * this.voiceVolume;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
}

export const sound = new SoundEngine();
export const hasArabicVoice = () =>
  typeof speechSynthesis !== "undefined" && speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("ar"));
