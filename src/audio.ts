export class GameAudio {
  private context?: AudioContext;
  muted = false;
  unlock(): void {
    if (this.muted) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => undefined);
    } catch {
      /* Audio is an optional enhancement. */
    }
  }
  play(event: string): void {
    if (this.muted || !this.context || this.context.state !== "running") return;
    const notes: Record<string, number[]> = {
      jump: [330, 440],
      key: [660, 880, 1100],
      star: [880, 1320],
      death: [180, 110],
      win: [523, 659, 784, 1047],
      switch: [300, 450],
    };
    (notes[event] ?? []).forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = this.context!.currentTime + index * 0.075;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.055, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      oscillator.connect(gain);
      gain.connect(this.context!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  }
}
