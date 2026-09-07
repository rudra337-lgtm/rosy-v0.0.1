export class SpectrogramScope {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  off: HTMLCanvasElement;
  offCtx: CanvasRenderingContext2D;
  dpr: number;
  carriers: Array<{ freq: number; phase: number; amp: number; drift: number }>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.off = document.createElement('canvas');
    const octx = this.off.getContext('2d');
    if (!octx) throw new Error('Offscreen context unavailable');
    this.offCtx = octx;
    this.carriers = [
      { freq: 0.12, phase: 0, amp: 0.8, drift: 0.00003 },
      { freq: 0.35, phase: 0, amp: 0.5, drift: -0.00002 },
      { freq: 0.68, phase: 0, amp: 0.3, drift: 0.00001 },
    ];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const w = this.canvas.clientWidth || 600;
    const h = this.canvas.clientHeight || 200;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.off.width = this.canvas.width;
    this.off.height = this.canvas.height;
    this.ctx.scale(this.dpr, this.dpr);
    this.offCtx.scale(this.dpr, this.dpr);
  }

  step(): void {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    // Scroll down by 1px
    this.offCtx.drawImage(this.off, 0, 1, w, h - 1, 0, 0, w, h - 1);
    // Clear top row
    this.offCtx.clearRect(0, h - 1, w, 1);

    // Generate new top row
    const img = this.offCtx.createImageData(w, 1);
    for (let x = 0; x < w; x++) {
      let val = Math.random() * 0.15;
      for (const c of this.carriers) {
        c.phase += c.freq + c.drift;
        const v = Math.sin(c.phase * Math.PI * 2) * c.amp;
        if (x / w > c.freq - 0.02 && x / w < c.freq + 0.02) val += v;
      }
      val = Math.max(0, Math.min(1, val));
      const idx = x * 4;
      img.data[idx] = Math.round(255 * val);
      img.data[idx + 1] = Math.round(180 * val + 50 * (1 - val));
      img.data[idx + 2] = Math.round(50 * val);
      img.data[idx + 3] = 255;
    }
    this.offCtx.putImageData(img, 0, h - 1);
  }

  render(): void {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    this.ctx.drawImage(this.off, 0, 0, w, h);
    // Labels
    this.ctx.fillStyle = '#d8dade';
    this.ctx.font = '9px monospace';
    this.ctx.fillText('SANDBOX SNR LITERACY', 6, 14);
    this.ctx.fillText('SIM BASEBAND', w - 100, 14);
  }

  injectTrack(track: import('../fusion/index.js').Track): void {
    const idx = this.carriers.length % 3;
    this.carriers[idx] = {
      freq: 0.1 + Math.random() * 0.8,
      phase: 0,
      amp: 0.4 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 0.0001,
    };
  }
}