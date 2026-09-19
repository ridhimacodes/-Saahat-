// Realistic Smartphone Ringtone Audio Controller
// Handles HTML5 audio playback with 100% volume, continuous looping, 
// realistic vibration cadence, and immediate cutoff upon answering or dismissing.

class RingtoneAudioController {
  private audio: HTMLAudioElement | null = null;
  private isRinging: boolean = false;
  private vibrationInterval: any = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Lazily initialized in browser context
  }

  private getOrCreateAudio(): HTMLAudioElement {
    if (!this.audio && typeof window !== 'undefined') {
      // Use embedded standard royalty-free smartphone ringtone
      this.audio = new Audio('/audio/ringtone.mp3');
      this.audio.preload = 'auto';
      this.audio.loop = true;
      this.audio.volume = 1.0; // Maximum volume
    }
    return this.audio!;
  }

  // Fallback synthesizer using Web Audio API if HTML5 Audio fails for any reason
  private playFallbackTone() {
    if (!this.isRinging || typeof window === 'undefined') return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtxClass();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const now = this.audioContext.currentTime;
      // Authentic phone ring dual frequencies (440Hz + 480Hz US standard tone)
      const freqs = [440, 480];
      freqs.forEach(freq => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.audioContext!.destination);

        osc.start(now);
        osc.stop(now + 1.8);
      });
    } catch {
      // Ignore
    }
  }

  // Trigger continuous realistic phone vibration
  private triggerVibration() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        // Standard phone ring vibration pattern: 1s vibrate, 0.5s pause
        navigator.vibrate([1000, 500]);
      } catch {
        // Unsupported or blocked
      }
    }
  }

  public start() {
    if (this.isRinging) return;
    this.isRinging = true;

    // 1. Play realistic phone ringtone with explicit max volume and continuous loop
    try {
      const audio = this.getOrCreateAudio();
      audio.currentTime = 0;
      audio.volume = 1.0; // Explicitly set to maximum volume
      audio.loop = true;   // Loops continuously until answered or dismissed

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Ring Me] HTML5 Audio play interrupted or restricted, using fallback synthesizer:', err);
          this.playFallbackTone();
        });
      }
    } catch (err) {
      console.warn('[Ring Me] Error initiating audio:', err);
      this.playFallbackTone();
    }

    // 2. Trigger realistic vibration cycle (1s vibrate, 0.5s pause, repeat)
    this.triggerVibration();
    if (this.vibrationInterval) clearInterval(this.vibrationInterval);
    this.vibrationInterval = setInterval(() => {
      if (this.isRinging) {
        this.triggerVibration();
      }
    }, 1500);
  }

  public stop() {
    this.isRinging = false;

    // 1. Stop audio immediately - zero lingering sound
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {
        // Ignore
      }
    }

    // 2. Stop Web Audio fallback if active
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch {
        // Ignore
      }
      this.audioContext = null;
    }

    // 3. Stop vibration immediately
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }
  }
}

export const ringtoneAudio = new RingtoneAudioController();
