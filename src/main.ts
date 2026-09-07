import { createWorld } from './fusion/index.js';
import { evaluateAgent, AgentOutput } from './agent/nullAgent.js';
import { PpiScope } from './scopes/ppi.js';
import { SpectrogramScope } from './scopes/spectrogram.js';
import { CityMapScope } from './scopes/citymap.js';
import { initCadScene, updateCadScene } from './scopes/cadScene.js';
import { createGpuPoints, GpuPoints } from './scopes/webgpuPoints.js';
import { el, fmtUtc, setMeter, escapeHtml } from './ui/dom.js';
import { VERBS, proofLine, ROLES, Role } from './doctrine/index.js';
import { Track } from './fusion/index.js';
import { hazardShelterRecommendation } from './twin/index.js';
import { CAD } from './cad/model.js';

type Mode = 'AIR' | 'SEA' | 'GROUND' | 'NEAR-SPACE' | 'CITY';

interface State {
  world: ReturnType<typeof createWorld>;
  mode: Mode;
  role: Role;
  audioOn: boolean;
  lastAgentEval: number;
  agentOut: AgentOutput | null;
  ppi: PpiScope;
  spec: SpectrogramScope;
  city: CityMapScope;
  gpu: GpuPoints | null;
  audioCtx: AudioContext | null;
  sweepRad: number;
}

let state: State;

async function boot(): Promise<void> {
  state = {
    world: createWorld(42),
    mode: 'AIR',
    role: 'observer',
    audioOn: false,
    lastAgentEval: 0,
    agentOut: null,
    ppi: new PpiScope(el('ppi')),
    spec: new SpectrogramScope(el('spec')),
    city: new CityMapScope(el('city')),
    gpu: null,
    audioCtx: null,
    sweepRad: 0,
  };

  initCadScene(el('cad3d'));
  state.gpu = await createGpuPoints(el('gpupts'));
  const gpuState = el('gpu-state');
  gpuState.textContent = state.gpu.mode === 'webgpu' ? 'WEBGPU' : 'CPU FALLBACK';
  gpuState.style.color = state.gpu.mode === 'webgpu' ? '#35b6a6' : '#ffb347';

  wireUI();
  loop(performance.now());
  startClock();
  probeApi();
}

function wireUI(): void {
  // Mode buttons
  const modeSeg = el('mode-seg');
  for (const btn of modeSeg.querySelectorAll<HTMLButtonElement>('button')) {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode as Mode;
      for (const b of modeSeg.querySelectorAll('button')) b.classList.toggle('on', b === btn);
    });
  }

  // Sliders
  const sliders = ['s-gnss', 's-adsb', 's-ais', 's-seis'] as const;
  for (const id of sliders) {
    const input = el(id) as HTMLInputElement;
    const valEl = el(`${id}-v`);
    input.addEventListener('input', () => {
      const v = parseInt(input.value, 10);
      valEl.textContent = `${v}%`;
      applyControls();
    });
  }

  // Toggles
  const toggles = [
    ['t-adsb', 'adsb'], ['t-ais', 'ais'], ['t-metar', 'metar'],
    ['t-usgs', 'usgs'], ['t-firms', 'firms'], ['t-tle', 'tle']
  ] as const;
  for (const [id, key] of toggles) {
    const input = el(id) as HTMLInputElement;
    input.addEventListener('change', () => {
      state.world.controls.openData[key] = input.checked;
    });
  }

  // Role
  const roleSel = el('role') as HTMLSelectElement;
  roleSel.addEventListener('change', () => {
    state.role = roleSel.value as Role;
  });

  // Audio
  const audioTog = el('t-audio') as HTMLInputElement;
  audioTog.addEventListener('change', () => { state.audioOn = audioTog.checked; });

  // Proof button
  const proofBtn = el('btn-proof');
  const proofOut = el('proof-out');
  proofBtn.addEventListener('click', async () => {
    proofOut.textContent = 'Running local proof…';
    proofOut.textContent = proofLine();
    try {
      const res = await fetch('/api/proof');
      if (res.ok) {
        const data = await res.json();
        proofOut.textContent = `API: interceptModule=${data.interceptModule} weaponsBus=${data.weaponsBus} typeofIntercept="${data.typeofIntercept}"`;
      }
    } catch {
      proofOut.textContent += ' (API offline — local proof only)';
    }
  });

  applyControls();
}

function applyControls(): void {
  const c = state.world.controls;
  c.adsbDensity = parseInt((el('s-adsb') as HTMLInputElement).value, 10) / 100;
  c.aisDensity = parseInt((el('s-ais') as HTMLInputElement).value, 10) / 100;
  c.gnssHealth = parseInt((el('s-gnss') as HTMLInputElement).value, 10) / 100;
  c.seismicRate = parseInt((el('s-seis') as HTMLInputElement).value, 10) / 100;
}

function startClock(): void {
  const clock = el('utc-clock');
  setInterval(() => { clock.textContent = fmtUtc(); }, 1000);
  clock.textContent = fmtUtc();
  el('commit').textContent = (typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'local');
  el('nbv').textContent = (typeof __NULL_BUS_VERSION__ !== 'undefined' ? __NULL_BUS_VERSION__ : '0.1.0-lab');
}

async function probeApi(): Promise<void> {
  const apiState = el('api-state');
  try {
    const r = await fetch('/api/health');
    if (r.ok) { const d = await r.json(); apiState.textContent = `api: linked (v${d.version})`; apiState.style.color = '#35b6a6'; }
    else throw new Error('bad status');
  } catch {
    apiState.textContent = 'api: offline · synthetic mode';
    apiState.style.color = '#ffb347';
  }
  setInterval(probeApi, 10000);
}

function clickAudio(): void {
  if (!state.audioOn) return;
  state.audioCtx ??= new AudioContext();
  const ac = state.audioCtx;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = 1320;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, ac.currentTime + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.06);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.08);
}

function loop(now: number): void {
  const dt = Math.min(0.05, (now - (state.lastFrame || now)) / 1000);
  state.lastFrame = now;

  state.world.step(dt);
  state.sweepRad += dt * 0.9;
  if (state.sweepRad > Math.PI * 2) state.sweepRad -= Math.PI * 2;

  // Agent eval every 2s
  if (now - state.lastAgentEval > 2000) {
    state.lastAgentEval = now;
    const out = evaluateAgent({
      tracks: state.world.tracks,
      hazards: state.world.hazards.map(h => ({ type: h.type, at: h.at, severity: h.severity, shelterRelevant: h.shelterRelevant })),
      role: state.role,
      displayBudget: 12,
    });
    const wasShowing = state.agentOut?.verbs.includes('SHOW') ?? false;
    const nowShowing = out.verbs.includes('SHOW');
    if (nowShowing && !wasShowing) clickAudio();
    state.agentOut = out;
    updateHud(out);
    updateCards(out);
    updateLog(out.log);
  }

  // Render scopes
  state.ppi.draw(state.world.tracks, state.sweepRad, state.mode, state.agentOut?.attention?.id || null);
  state.spec.step();
  if (state.agentOut?.attention) state.spec.injectTrack(state.agentOut.attention);
  state.spec.render();
  state.city.draw(state.world.hazards, state.agentOut?.shelter ? { ...state.agentOut.shelter, from: state.world.hazards.find(h => h.severity >= 0.5 && h.shelterRelevant)?.at || [12.5, -5] } : null, state.world.tracks, state.mode);
  updateCadScene(dt);
  if (state.gpu) state.gpu.render(now / 1000);

  requestAnimationFrame(loop);
}

function updateHud(out: AgentOutput): void {
  el('hud-att').textContent = out.attention?.id || '—';
  el('hud-budget').textContent = out.shown.length.toString();
  el('hud-verbs').textContent = out.verbs.join(' · ');
}

function updateCards(out: AgentOutput): void {
  const budgetFill = el('budget-fill');
  const shown = out.shown.length;
  const cap = 12;
  setMeter(budgetFill, (shown / cap) * 100);
  el('budget-shown').textContent = shown.toString();
  el('budget-held').textContent = out.held.toString();
  el('budget-cap').textContent = cap.toString();

  const att = out.attention;
  if (att) {
    const rng = Math.hypot(att.x, att.y).toFixed(1);
    const brg = ((Math.atan2(att.x, att.y) * 180 / Math.PI + 360) % 360).toFixed(0);
    el('attention-body').innerHTML = `
      <div><b>ID:</b> ${escapeHtml(att.id)}</div>
      <div><b>Kind:</b> ${escapeHtml(att.kind)} <span class="teal">(${att.domain})</span></div>
      <div><b>Range:</b> ${rng} km <b>Brg:</b> ${brg}°</div>
      <div><b>Quality:</b> ${(att.quality * 100).toFixed(0)}% <b>Inbound:</b> ${att.inbound ? 'YES' : 'no'}</div>
      <div class="micro amber">ATTENTION ≠ AIMPOINT</div>`;
  } else {
    el('attention-body').innerHTML = '<div class="micro">No tracks in view</div>';
  }

  if (out.shelter) {
    el('shelter-body').innerHTML = `
      <div><b>Node:</b> ${escapeHtml(out.shelter.nodeId)}</div>
      <div><b>Walk ETA:</b> ${out.shelter.etaMin} min</div>
      <div><b>Capacity:</b> ${out.shelter.capacity}</div>
      <div class="micro">${escapeHtml(out.shelter.reason)}</div>
      ${state.role !== 'mayor' ? '<div class="micro amber">Mayor role required to release SHELTER</div>' : ''}`;
  } else {
    el('shelter-body').innerHTML = 'No active shelter directive. 12 nodes on standby.';
  }
}

function updateLog(lines: string[]): void {
  const list = el('log-list');
  for (const line of lines) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="t">${fmtUtc()}</span> ${escapeHtml(line)}`;
    list.prepend(li);
  }
  while (list.children.length > 14) list.lastChild?.remove();
}

boot().catch(e => { console.error(e); document.body.innerHTML = `<pre style="color:#ff6a3d;padding:1rem">${e.stack}</pre>`; });