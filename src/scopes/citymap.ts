import { CITY, ShelterNode } from '../twin/index.js';

export class CityMapScope {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  tsunamiPhase: number = 0;

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
    const w = this.canvas.clientWidth || 500;
    const h = this.canvas.clientHeight || 350;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
  }

  kmToPx(x: number, y: number, w: number, h: number): [number, number] {
    const minX = -5, maxX = 30, minY = -20, maxY = 5;
    const px = ((x - minX) / (maxX - minX)) * w;
    const py = ((maxY - y) / (maxY - minY)) * h;
    return [px, py];
  }

  draw(
    hazards: Array<{ type: string; at: [number, number]; severity: number; since: number }>,
    shelterPlan: { nodeId: string; etaMin: number; from: [number, number] } | null,
    tracks: import('../fusion/index.js').Track[],
    mode: string
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#151a1f';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Coastline (rough)
    ctx.strokeStyle = '#35b6a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -5; x <= 30; x += 1) {
      const y = -14 + Math.sin(x * 0.5) * 2 + (x < 8 ? -2 : 0);
      const [px, py] = this.kmToPx(x, y, w, h);
      if (x === -5) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Flood polygon
    const floodHaz = hazards.find(h => h.type === 'flood');
    if (floodHaz) {
      ctx.fillStyle = 'rgba(53,182,166,0.18)';
      ctx.beginPath();
      for (let i = 0; i < CITY.floodPolygon.length; i++) {
        const [x, y] = CITY.floodPolygon[i];
        const [px, py] = this.kmToPx(x, y, w, h);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(53,182,166,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Tsunami arc
    const tsunamiHaz = hazards.find(h => h.type === 'tsunami');
    if (tsunamiHaz) {
      this.tsunamiPhase += 0.003;
      const age = (Date.now() / 1000 - tsunamiHaz.since);
      const maxR = 15 + age * 0.8;
      ctx.strokeStyle = 'rgba(255,179,71,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const [cx, cy] = this.kmToPx(tsunamiHaz.at[0], tsunamiHaz.at[1], w, h);
      ctx.arc(cx, cy, maxR, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#ffb347';
      ctx.font = '10px monospace';
      ctx.fillText(`TSUNAMI ETA ${Math.max(0, Math.round(15 - age))}min`, cx - 60, cy - maxR - 10);
    }

    // Shelters
    for (const s of CITY.shelters) {
      if (!s.open) continue;
      const [px, py] = this.kmToPx(s.x, s.y, w, h);
      const isPlan = shelterPlan && shelterPlan.nodeId === s.id;
      ctx.fillStyle = isPlan ? '#ff6a3d' : '#d8dade';
      ctx.fillRect(px - 6, py - 6, 12, 12);
      if (isPlan) {
        ctx.strokeStyle = '#ff6a3d';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 8, py - 8, 16, 16);
      }
      ctx.fillStyle = '#080b0e';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.id, px, py + 3);
    }

    // Hospitals
    ctx.fillStyle = '#ff6a3d';
    for (const h of CITY.hospitals) {
      const [px, py] = this.kmToPx(h.x, h.y, w, h);
      ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.stroke();
    }

    // Bridges
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    for (const b of CITY.bridges) {
      const [x1, y1] = this.kmToPx(b.from[0], b.from[1], w, h);
      const [x2, y2] = this.kmToPx(b.to[0], b.to[1], w, h);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // Array site
    const [ax, ay] = this.kmToPx(0, 0, w, h);
    ctx.strokeStyle = '#d8dade';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ax, ay, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#d8dade';
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PN-LISTEN-1', ax, ay + 18);

    // Shelter route line
    if (shelterPlan) {
      const [fx, fy] = this.kmToPx(shelterPlan.from[0], shelterPlan.from[1], w, h);
      const snode = CITY.shelters.find(s => s.id === shelterPlan.nodeId);
      if (snode) {
        const [sx, sy] = this.kmToPx(snode.x, snode.y, w, h);
        ctx.strokeStyle = '#ff6a3d';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(sx, sy); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Ground tracks (mode filter)
    for (const t of tracks) {
      if (t.domain !== 'GROUND') continue;
      const [px, py] = this.kmToPx(t.x, t.y, w, h);
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }
}