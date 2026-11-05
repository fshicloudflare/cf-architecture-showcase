import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { POINT_COUNT, LAND_MASK } from "./globe-land.js";

const RADIUS = 1;
const DEG = Math.PI / 180;
const COLORS = { land: "#8f8fa3", grid: "#ffffff", accent: "#f6821f" };

const CITIES = [
  { id: "ny", lat: 40.7128, lon: -74.006 },
  { id: "atlanta", lat: 33.749, lon: -84.388 },
  { id: "london", lat: 51.5074, lon: -0.1278 },
  { id: "hebrides", lat: 57.5, lon: -7 },
  { id: "mumbai", lat: 19.076, lon: 72.8777 },
  { id: "bangalore", lat: 12.9716, lon: 77.5946 },
  { id: "tokyo", lat: 35.6762, lon: 139.6503 },
  { id: "fukuoka", lat: 33.59, lon: 130.4 },
  { id: "sf", lat: 37.7749, lon: -122.4194 },
  { id: "saopaulo", lat: -23.5505, lon: -46.6333 },
  { id: "denver", lat: 39.739, lon: -104.99 },
  { id: "berlin", lat: 52.52, lon: 13.405 },
  { id: "singapore", lat: 1.3521, lon: 103.8198 },
  { id: "madrid", lat: 40.4168, lon: -3.7038 },
  { id: "sydney", lat: -33.8688, lon: 151.2093 },
  { id: "joburg", lat: -26.2041, lon: 28.0473 },
  { id: "chicago", lat: 41.878, lon: -87.629 },
  { id: "dubai", lat: 25.2048, lon: 55.2708 },
];

const ARCS = [
  ["ny", "atlanta"], ["london", "hebrides"], ["mumbai", "bangalore"], ["tokyo", "fukuoka"],
  ["sf", "saopaulo"], ["saopaulo", "denver"], ["berlin", "singapore"], ["singapore", "madrid"],
  ["sydney", "joburg"], ["chicago", "dubai"],
];

function toVector(lat, lon, r = RADIUS) {
  const phi = (90 - lat) * DEG;
  const theta = lon * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function cityVector(id, r = RADIUS) {
  const c = CITIES.find((city) => city.id === id);
  return toVector(c.lat, c.lon, r);
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function buildGraticule() {
  const material = new THREE.LineBasicMaterial({ color: COLORS.grid, transparent: true, opacity: 0.14 });
  const r = RADIUS * 1.002;
  const group = new THREE.Group();
  for (let m = 0; m < 18; m++) {
    const theta = (m / 18) * Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const phi = (i / 96) * Math.PI;
      pts.push(new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material));
  }
  for (let p = 1; p <= 11; p++) {
    const phi = (p / 12) * Math.PI;
    const y = r * Math.cos(phi);
    const ringR = r * Math.sin(phi);
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(ringR * Math.cos(a), y, ringR * Math.sin(a)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material));
  }
  return group;
}

function buildLand() {
  const mask = Uint8Array.from(atob(LAND_MASK), (c) => c.charCodeAt(0));
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points = [];
  for (let i = 0; i < POINT_COUNT; i++) {
    if (!(mask[i >> 3] & (1 << (i & 7)))) continue;
    const y = 1 - (i / (POINT_COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * golden;
    const lat = Math.asin(y) / DEG;
    const lon = Math.atan2(Math.sin(theta) * r, Math.cos(theta) * r) / DEG;
    points.push(toVector(lat, lon));
  }
  const mesh = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.0062, 6),
    new THREE.MeshBasicMaterial({ color: COLORS.land, side: THREE.DoubleSide, toneMapped: false }),
    points.length,
  );
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  points.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.lookAt(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function buildArcs() {
  const material = new THREE.MeshBasicMaterial({ color: COLORS.accent, toneMapped: false });
  const group = new THREE.Group();
  const arcs = ARCS.map(([from, to], i) => {
    const a = cityVector(from);
    const b = cityVector(to);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(RADIUS * (1 + a.distanceTo(b) * 0.32));
    const geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 80, 0.0042, 6, false);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh);
    return { geometry, count: geometry.index ? geometry.index.count : 0, phase: i / ARCS.length };
  });
  return { group, arcs };
}

function updateArcs(arcs, elapsed, animate) {
  for (const arc of arcs) {
    if (!animate) {
      arc.geometry.setDrawRange(0, arc.count);
      continue;
    }
    const head = (((elapsed * 0.26 + arc.phase) % 1) * 1.35);
    const tail = Math.max(0, head - 0.35);
    const start = Math.floor(Math.min(1, tail) * arc.count);
    const end = Math.floor(Math.min(1, head) * arc.count);
    const length = Math.max(0, end - start);
    arc.geometry.setDrawRange(start - (start % 3), length - (length % 3));
  }
}

function buildMarkers() {
  const dot = new THREE.MeshBasicMaterial({ color: COLORS.accent, toneMapped: false });
  const ring = new THREE.MeshBasicMaterial({ color: COLORS.accent, transparent: true, opacity: 0.45, toneMapped: false });
  const dotGeometry = new THREE.CircleGeometry(0.02, 20);
  const ringGeometry = new THREE.RingGeometry(0.03, 0.036, 28);
  const group = new THREE.Group();
  for (const city of CITIES) {
    const marker = new THREE.Group();
    const pos = toVector(city.lat, city.lon, RADIUS * 1.004);
    marker.position.copy(pos);
    marker.lookAt(pos.clone().multiplyScalar(2));
    marker.add(new THREE.Mesh(dotGeometry, dot));
    const ringMesh = new THREE.Mesh(ringGeometry, ring);
    ringMesh.position.z = 5e-4;
    marker.add(ringMesh);
    group.add(marker);
  }
  return group;
}

function mountGlobe(host) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const animate = !reducedMotion;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3);

  const globe = new THREE.Group();
  globe.rotation.x = 0.42;
  globe.scale.setScalar(animate ? 0.45 : 0.68);

  const occluder = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.995, 64, 64), new THREE.MeshBasicMaterial({ colorWrite: false }));
  occluder.renderOrder = -1;
  const { group: arcGroup, arcs } = buildArcs();
  globe.add(occluder, buildGraticule(), buildLand(), arcGroup, buildMarkers());
  scene.add(globe);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.autoRotate = animate;
  controls.autoRotateSpeed = 0.55;
  controls.rotateSpeed = 0.5;

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!host.offsetParent) return;
    const target = 0.68;
    if (animate) globe.scale.setScalar(globe.scale.x + (target - globe.scale.x) * 0.07);
    updateArcs(arcs, clock.getElapsedTime(), animate);
    controls.update();
    renderer.render(scene, camera);
  });

  host.classList.add("is-live");
}

const host = document.getElementById("globe-canvas");
if (host && supportsWebGL()) {
  try {
    mountGlobe(host);
  } catch (err) {
    console.error("Globe failed to initialize; showing static fallback.", err);
  }
}
