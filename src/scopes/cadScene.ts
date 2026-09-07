import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAD, CadPart } from '../cad/model.js';

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let partsMesh: Map<string, THREE.Mesh> = new Map();
let sectorRing: THREE.Mesh;
let beacon: THREE.Mesh;
let animTime = 0;

export function initCadScene(canvas: HTMLCanvasElement): void {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = false;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e11);
  scene.fog = new THREE.Fog(0x0b0e11, 30, 120);

  camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
  camera.position.set(18, 18, 18);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = true;
  controls.minDistance = 10;
  controls.maxDistance = 100;

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x1a1d22, 0.6);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(20, 40, 20);
  scene.add(dir);

  // Ground grid
  const grid = new THREE.GridHelper(120, 40, 0x1a2228, 0x0f1317);
  grid.position.y = -0.01;
  scene.add(grid);

  // Build parts from CAD
  for (const part of CAD.parts) {
    const mesh = buildPartMesh(part);
    if (mesh) {
      mesh.userData.partId = part.id;
      partsMesh.set(part.id, mesh);
      scene.add(mesh);
    }
  }

  // Sector ring (listening attention)
  const ringGeo = new THREE.RingGeometry(9.5, 10.5, 64, 1, 0, Math.PI / 3);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x35b6a6, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false
  });
  sectorRing = new THREE.Mesh(ringGeo, ringMat);
  sectorRing.rotation.x = -Math.PI / 2;
  sectorRing.position.y = 0.5;
  scene.add(sectorRing);

  // Beacon on cal tower
  const beaconGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x35b6a6 });
  beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(10, 6.5, 0);
  scene.add(beacon);

  // Signage sprites
  addSignage('PN-LISTEN-1 RX ARRAY', [0, 12, 0]);
  addSignage('CIVIL SHELTER S-01', [40, 2, -15]);
  addSignage('RF RECEIVE SITE — NO TRANSMITTER ON SITE', [0, 14, -10]);

  window.addEventListener('resize', () => onResize(canvas));
}

function buildPartMesh(part: CadPart): THREE.Mesh | null {
  let geo: THREE.BufferGeometry;
  const mat = new THREE.MeshStandardMaterial({
    color: partMaterialColor(part.material),
    roughness: 0.7,
    metalness: part.material.includes('Steel') ? 0.6 : 0.1,
  });

  const p = part.geometry.params;
  switch (part.geometry.type) {
    case 'Torus':
      geo = new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments);
      break;
    case 'Box':
      geo = new THREE.BoxGeometry(p.width, p.height, p.depth);
      break;
    case 'Cylinder':
      geo = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments);
      break;
    case 'Cone':
      geo = new THREE.ConeGeometry(p.radius, p.height, p.radialSegments);
      break;
    case 'ShapeExtrude':
      // Vivaldi-ish fin: triangle-ish shape
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(p.width, p.height / 2);
      shape.lineTo(0, p.height);
      shape.lineTo(0, 0);
      const extrude = new THREE.ExtrudeGeometry(shape, { depth: p.depth, bevelEnabled: false });
      geo = extrude;
      break;
    default:
      return null;
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  // Position from part.id heuristics
  positionPartMesh(mesh, part);
  return mesh;
}

function partMaterialColor(m: string): number {
  if (m.includes('Concrete')) return 0x7a7f86;
  if (m.includes('Steel')) return 0x9aa0a8;
  if (m.includes('Composite')) return 0x5a5f66;
  if (m.includes('Fiber')) return 0x4a4f55;
  return 0x6a6f76;
}

function positionPartMesh(mesh: THREE.Mesh, part: CadPart): void {
  const id = part.id;
  if (id === 'foundation') {
    mesh.position.set(0, -0.2, 0);
    mesh.rotation.x = -Math.PI / 2;
  } else if (id === 'vault') {
    mesh.position.set(0, -1.2, 0);
  } else if (id === 'tower') {
    mesh.position.set(10, 3, 0);
  } else if (id === 'headhouse') {
    mesh.position.set(40, 1.5, -15);
  } else if (id === 'fence') {
    mesh.position.set(0, 0.1, 0);
    mesh.rotation.x = -Math.PI / 2;
  } else if (id.startsWith('element-')) {
    const idx = parseInt(id.split('-')[1], 10);
    const angle = (idx / 24) * Math.PI * 2;
    const r = 7;
    mesh.position.set(Math.cos(angle) * r, 1.1, Math.sin(angle) * r);
    mesh.rotation.y = angle + Math.PI / 2;
  } else if (id === 'sign-array' || id === 'sign-shelter') {
    // positioned via addSignage
  }
}

function addSignage(text: string, pos: [number, number, number]): void {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(10,11,14,0.85)';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#d8dade';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 504, 120);
  ctx.fillStyle = '#d8dade';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 80);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(12, 3, 1);
  spr.position.set(pos[0], pos[1], pos[2]);
  scene.add(spr);
}

function onResize(canvas: HTMLCanvasElement): void {
  if (!renderer) return;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}

export function updateCadScene(dt: number): void {
  animTime += dt;
  if (sectorRing) {
    sectorRing.rotation.z = animTime * 0.4;
  }
  if (beacon) {
    beacon.material.opacity = 0.5 + 0.5 * Math.sin(animTime * 4);
  }
  controls.update();
  renderer.render(scene, camera);
}

export function disposeCadScene(): void {
  if (renderer) renderer.dispose();
}