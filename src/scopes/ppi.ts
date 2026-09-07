export class PpiScope {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const w = this.canvas.clientWidth || 400;
    const h = this.canvas.clientHeight || 400;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
  }

  draw(tracks: import('../fusion/index.js').Track[], sweepRad: number, mode: string, attentionId: string | null): void {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(cx, cy) - 10;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#080b0e';
    ctx.fillRect(0, 0, w, h);

    // Range rings
    ctx.strokeStyle = '#1a2228';
    ctx.lineWidth = 1;
    for (let r = 0.25; r <= 1; r += 0.25) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Bearing spokes
    for (let b = 0; b < 360; b += 30) {
      const rad = (b - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR);
      ctx.stroke();
    }

    // Sweep wedge (receive attention)
    const sweepWidth = 0.6;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(53,182,166,0.25)');
    grad.addColorStop(1, 'rgba(53,182,166,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, sweepRad - sweepWidth, sweepRad + sweepWidth);
    ctx.closePath();
    ctx.fill();

    // Tracks
    for (const t of tracks) {
      const rng = Math.hypot(t.x, t.y);
      if (rng > 58) continue;
      const brg = (Math.atan2(t.x, t.y) * 180 / Math.PI + 360) % 360;
      const rad = (brg - 90) * Math.PI / 180;
      const rr = (rng / 58) * maxR;
      const xx = cx + Math.cos(rad) * rr;
      const yy = cy + Math.sin(rad) * rr;

      let color = '#d8dade';
      if (t.domain === 'SEA') color = '#35b6a6';
      else if (t.domain === 'GROUND') color = '#ffb347';
      else if (t.domain === 'NEAR-SPACE') color = '#8a6fff';
      if (!this.domainEnabled(t.domain, mode)) color = '#444a52';

      const isAtt = t.id === attentionId;
      ctx.beginPath();
      ctx.arc(xx, yy, isAtt ? 6 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isAtt ? '#ff6a3d' : color;
      ctx.fill();
      if (isAtt) {
        ctx.strokeStyle = '#ff6a3d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(xx, yy, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Labels
    ctx.fillStyle = '#d8dade';
    ctx.font = '10px monospace';
    ctx.fillText('RX ONLY', 8, 16);
    ctx.fillText(`RNG 58km`, w - 70, 16);
    ctx.restore();
  }

  domainEnabled(domain: string, mode: string): boolean {
    if (mode === 'CITY') return domain === 'GROUND';
    if (mode === 'AIR') return domain === 'AIR';
    if (mode === 'SEA') return domain === 'SEA';
    if (mode === 'GROUND') return domain === 'GROUND';
    if (mode === 'NEAR-SPACE') return domain === 'NEAR-SPACE';
    return true;
  }
}