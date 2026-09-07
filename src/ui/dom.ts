export function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Element #${id} not found`);
  return e as T;
}

export function fmtUtc(): string {
  return new Date().toISOString().slice(11, 19) + 'Z';
}

export function setMeter(fillEl: HTMLElement, pct: number): void {
  fillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

export function escapeHtml(s: string): string {
  const map: Record<string, string> = { '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" };
  return s.replace(/[&<>"']/g, c => map[c] ?? c);
}