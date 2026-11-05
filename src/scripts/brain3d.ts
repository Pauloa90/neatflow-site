// Cérebro 3D da vitrine: estrelas (ideias/projetos) agrupadas por assunto, ligações curvas
// com pulsos a viajar, poeira estelar. Mesmo visual do "universo" do Cérebro, com dados inventados.
import * as THREE from 'three';

const ST = { ativo: '#a9d6ff', morno: '#ffd699', parado: '#ff7b6b', ideia: '#d0b3ff', feito: '#9fe0b0' } as const;
type St = keyof typeof ST;
type Node = { id: string; l: string; st: St; dom?: boolean; p?: string; hit?: boolean; size: number; local: THREE.Vector3; g: THREE.Group; glow: THREE.Sprite; core: THREE.Sprite; label: HTMLSpanElement; sx: number; sy: number; front: number };

const DATA: Array<[id: string, label: string, st: St, parent?: string, hit?: boolean]> = [
  ['work', 'Work', 'ativo'], ['yt', 'YouTube', 'ativo'], ['home', 'Home', 'morno'], ['ideas', 'Ideas', 'ideia'],
  ['client', 'Client A', 'ativo', 'work', true], ['invoice', 'Invoice flow', 'feito', 'work'], ['site', 'Website', 'ativo', 'work'], ['proposal', 'Proposal', 'morno', 'work'], ['mailbot', 'Email bot', 'parado', 'work'],
  ['podcast', 'Podcast', 'morno', 'yt'], ['course', 'Course', 'ideia', 'yt'], ['scripts', 'Scripts', 'ativo', 'yt'], ['thumbs', 'Thumbnails', 'feito', 'yt'], ['shorts', 'Shorts', 'parado', 'yt'],
  ['dash', 'Dashboard', 'ativo', 'home'], ['printer', '3D printer', 'feito', 'home'], ['energy', 'Energy', 'morno', 'home'], ['notes', 'Notes', 'ativo', 'home'],
  ['localai', 'Local AI', 'ativo', 'ideas'], ['lab', 'Lab', 'ideia', 'ideas'], ['app', 'App idea', 'ideia', 'ideas'], ['news', 'Newsletter', 'parado', 'ideas'],
];
const CROSS: Array<[string, string]> = [['client', 'notes'], ['client', 'lab'], ['podcast', 'notes'], ['course', 'site'], ['localai', 'scripts'], ['dash', 'yt'], ['invoice', 'mailbot'], ['app', 'localai'], ['news', 'site']];

function tex(stops: Array<[number, number]>) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, a]) => r.addColorStop(o, `rgba(255,255,255,${a})`));
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const ringTex = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.stroke();
  return new THREE.CanvasTexture(c);
};

export function mountBrain(host: HTMLElement, opts: { isActive: () => boolean; onInteract: () => void }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  const labelsEl = host.querySelector<HTMLElement>('[data-labels]')!;
  const searchEl = host.querySelector<HTMLElement>('[data-search]')!;

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { host.dataset.nogl = ''; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 1, 5000);
  const world = new THREE.Group(); scene.add(world);

  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const T_GLOW = tex([[0, 1], [0.12, 0.55], [0.35, 0.16], [0.7, 0.03], [1, 0]]);
  const T_CORE = tex([[0, 1], [0.25, 0.9], [0.5, 0.25], [1, 0]]);
  const T_NEB = tex([[0, 0.5], [0.4, 0.2], [0.8, 0.05], [1, 0]]);
  const T_RING = ringTex();
  const add = (map: THREE.Texture, color: THREE.ColorRepresentation, opacity: number) =>
    new THREE.SpriteMaterial({ map, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

  // poeira estelar e nebulosas
  [[700, 1100, 1.6, 0.55], [1100, 1700, 1.1, 0.35]].forEach(([a, b, sz, op]) => {
    const g = new THREE.BufferGeometry(), p: number[] = [];
    for (let i = 0; i < 500; i++) { const r = a + rnd() * (b - a), t = rnd() * 6.283, f = Math.acos(2 * rnd() - 1); p.push(r * Math.sin(f) * Math.cos(t), r * Math.cos(f), r * Math.sin(f) * Math.sin(t)); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xb9bdf0, size: sz, sizeAttenuation: false, transparent: true, opacity: op })));
  });
  [['#3b2f8f', -160, 60, -260, 700], ['#1d4f7a', 200, -80, -320, 640], ['#5a2a6e', 40, 140, -420, 520]].forEach(([c, x, y, z, s]) => {
    const sp = new THREE.Sprite(add(T_NEB, c as string, 0.55)); sp.position.set(x as number, y as number, z as number); sp.scale.setScalar(s as number); scene.add(sp);
  });

  // nós
  const nodes: Node[] = [];
  const by: Record<string, Node> = {};
  const fib = (i: number, n: number, r: number) => { const y = 1 - ((i + 0.5) / n) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963 + 0.6; return new THREE.Vector3(Math.cos(th) * rr * r, y * r * 0.75, Math.sin(th) * rr * r); };
  const doms = DATA.filter((d) => !d[3]);
  DATA.forEach(([id, l, st, p, hit]) => {
    let local: THREE.Vector3;
    if (!p) local = fib(doms.findIndex((d) => d[0] === id), doms.length, 150);
    else {
      const base = by[p].local, dir = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      local = base.clone().add(dir.multiplyScalar(55 + rnd() * 35)).add(base.clone().normalize().multiplyScalar(20));
    }
    const size = !p ? 34 : hit ? 26 : 15 + rnd() * 8;
    const col = new THREE.Color(ST[st]);
    const g = new THREE.Group(); g.position.copy(local);
    const glow = new THREE.Sprite(add(T_GLOW, col, 0.85)); glow.scale.setScalar(size * 3.4);
    const core = new THREE.Sprite(add(T_CORE, col.clone().lerp(new THREE.Color('#fff'), 0.65), 1)); core.scale.setScalar(size * 0.9);
    g.add(glow, core);
    if (!p) { const r = new THREE.Sprite(add(T_RING, 0xd6d9ff, 0.45)); r.scale.setScalar(size * 1.5); g.add(r); }
    world.add(g);
    const label = document.createElement('span'); label.textContent = l; label.className = 'b3-label' + (!p ? ' is-dom' : ''); labelsEl.append(label);
    const n: Node = { id, l, st, dom: !p, p, hit, size, local, g, glow, core, label, sx: 0, sy: 0, front: 0 };
    nodes.push(n); by[id] = n;
  });

  // ligações curvas + pulsos
  type Edge = { a: Node; b: Node; curve: THREE.QuadraticBezierCurve3; line: THREE.Line; mat: THREE.LineBasicMaterial; base: number; pulse: THREE.Sprite; t: number; v: number };
  const edges: Edge[] = [];
  const mkEdge = (a: Node, b: Node, cross: boolean) => {
    const mid = a.local.clone().add(b.local).multiplyScalar(0.5);
    mid.add(mid.clone().normalize().multiplyScalar(cross ? 60 : 18));
    const curve = new THREE.QuadraticBezierCurve3(a.local, mid, b.local);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
    const base = cross ? 0.2 : 0.3;
    const mat = cross
      ? new THREE.LineDashedMaterial({ color: 0xc9a7ff, dashSize: 5, gapSize: 6, transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false })
      : new THREE.LineBasicMaterial({ color: 0x8fb0ff, transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat); if (cross) line.computeLineDistances(); world.add(line);
    const pulse = new THREE.Sprite(add(T_CORE, cross ? 0xd8c4ff : 0xbfd4ff, 0.9)); pulse.scale.setScalar(7); world.add(pulse);
    edges.push({ a, b, curve, line, mat, base, pulse, t: rnd(), v: 0.12 + rnd() * 0.22 });
  };
  nodes.forEach((n) => n.p && mkEdge(by[n.p], n, false));
  CROSS.forEach(([a, b]) => mkEdge(by[a], by[b], true));
  const neigh = (id: string) => { const s = new Set([id]); edges.forEach((e) => { if (e.a.id === id) s.add(e.b.id); if (e.b.id === id) s.add(e.a.id); }); return s; };

  // anel que pulsa no nó encontrado
  const ping = new THREE.Sprite(add(T_RING, 0x9fe0ff, 0)); world.add(ping);

  // estado de câmara/interação
  let W = 1, H = 1;
  const size = () => { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); };
  size(); const ro = new ResizeObserver(size); ro.observe(host);

  let rotY = 0.4, rotX = 0.18, vY = 0, vX = 0, dist = 900, distT = 430;
  const look = new THREE.Vector3(), lookT = new THREE.Vector3();
  let focus: string | null = null, hover: string | null = null, dragging = false, lastX = 0, lastY = 0, idleAt = 0, rotYT: number | null = null;

  const setFocus = (id: string | null) => {
    focus = id;
    if (!id) { distT = 430; lookT.set(0, 0, 0); rotYT = null; return; }
    const n = by[id]; rotYT = -Math.atan2(n.local.x, n.local.z);
    // ajusta para o caminho mais curto
    while (rotYT - rotY > Math.PI) rotYT -= Math.PI * 2; while (rotYT - rotY < -Math.PI) rotYT += Math.PI * 2;
    distT = 250;
  };

  const pick = (x: number, y: number) => {
    let best: Node | null = null, bd = 22;
    nodes.forEach((n) => { const d = Math.hypot(n.sx - x, n.sy - y); if (n.front > 0 && d < bd) { bd = d; best = n; } });
    return best as Node | null;
  };
  const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); opts.onInteract(); demoStop(); };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (dragging) { const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; vY = dx * 0.006; vX = dy * 0.004; rotY += vY; rotX = Math.max(-0.9, Math.min(0.9, rotX + vX)); rotYT = null; return; }
    const n = pick(e.clientX - r.left, e.clientY - r.top); hover = n ? n.id : null; canvas.style.cursor = n ? 'pointer' : 'grab';
    if (n) demoStop();
  };
  const onUp = () => { dragging = false; idleAt = performance.now(); };
  const onClick = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const n = pick(e.clientX - r.left, e.clientY - r.top); if (n) { opts.onInteract(); setFocus(focus === n.id ? null : n.id); } };
  const onLeave = () => { hover = null; idleAt = performance.now(); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('click', onClick); canvas.addEventListener('pointerleave', onLeave);

  // demonstração automática: escreve a pesquisa e voa até ao Client A
  const Q = 'where is Client A?';
  let demoT0 = performance.now(), demoOn = true;
  const demoStop = () => { if (demoOn) { demoOn = false; searchEl.textContent = 'drag to spin · click a star'; if (focus === 'client') setFocus(null); } idleAt = performance.now(); };
  const demo = (now: number) => {
    if (!demoOn && !dragging && !hover && now - idleAt > 6000 && !focus) { demoOn = true; demoT0 = now; }
    if (!demoOn) return;
    const t = ((now - demoT0) / 1000) % 10;
    searchEl.textContent = t < 1.6 ? Q.slice(0, Math.floor((t / 1.6) * Q.length)) : Q;
    if (t >= 1.9 && t < 6.5 && focus !== 'client') setFocus('client');
    if (t >= 6.5 && focus === 'client') setFocus(null);
  };

  // visibilidade: só desenha quando o painel está ativo e no ecrã
  let onScreen = true;
  const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting)); io.observe(host);

  const v = new THREE.Vector3();
  let raf = 0, prev = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!onScreen || !opts.isActive()) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    demo(now);

    if (!dragging) {
      vY *= 0.94; vX *= 0.9; rotY += vY;
      if (rotYT !== null) rotY += (rotYT - rotY) * 0.06;
      else if (!reduce && !hover) rotY += dt * 0.12;
      rotX += ((focus ? 0.05 : 0.18) - rotX) * 0.02;
    }
    world.rotation.set(rotX, rotY, 0);
    world.updateMatrixWorld();
    if (focus) by[focus].g.getWorldPosition(lookT);
    dist += (distT - dist) * 0.06; look.lerp(lookT, 0.06);
    cam.position.set(look.x, look.y, look.z + dist); cam.lookAt(look);

    const active = hover ?? focus;
    const ns = active ? neigh(active) : null;
    const tt = now / 1000;
    nodes.forEach((n, i) => {
      const on = !ns || ns.has(n.id);
      const tw = 1 + Math.sin(tt * 1.6 + i * 1.3) * 0.06;
      const big = active === n.id ? 1.35 : 1;
      n.glow.scale.setScalar(n.size * 3.4 * tw * big); n.core.scale.setScalar(n.size * 0.9 * big);
      (n.glow.material as THREE.SpriteMaterial).opacity += ((on ? 0.85 : 0.12) - (n.glow.material as THREE.SpriteMaterial).opacity) * 0.15;
      (n.core.material as THREE.SpriteMaterial).opacity += ((on ? 1 : 0.25) - (n.core.material as THREE.SpriteMaterial).opacity) * 0.15;
      n.g.getWorldPosition(v);
      const camSpace = v.clone().applyMatrix4(cam.matrixWorldInverse); n.front = -camSpace.z;
      v.project(cam); n.sx = (v.x * 0.5 + 0.5) * W; n.sy = (-v.y * 0.5 + 0.5) * H;
      const show = n.dom || (ns ? ns.has(n.id) : false) || (!ns && n.hit);
      const depth = Math.max(0.35, Math.min(1, 1.6 - n.front / 520));
      n.label.style.transform = `translate(${n.sx.toFixed(1)}px,${(n.sy + n.size * 0.55 + 4).toFixed(1)}px) translateX(-50%)`;
      n.label.style.opacity = String(n.front > 0 && show ? (ns && ns.has(n.id) ? 1 : depth * 0.85) : 0);
      n.label.classList.toggle('is-on', active === n.id);
    });
    edges.forEach((e) => {
      const on = !ns || (ns.has(e.a.id) && ns.has(e.b.id) && (e.a.id === active || e.b.id === active));
      e.mat.opacity += ((on ? (ns ? 0.85 : e.base) : 0.05) - e.mat.opacity) * 0.15;
      e.t = (e.t + dt * e.v * (on && ns ? 2.2 : 1)) % 1;
      e.pulse.position.copy(e.curve.getPoint(e.t));
      (e.pulse.material as THREE.SpriteMaterial).opacity = (on ? 0.9 : 0.1) * Math.sin(e.t * Math.PI);
    });
    // ping no nó em foco
    const pm = ping.material as THREE.SpriteMaterial;
    if (focus) { const ph = (tt * 0.8) % 1; ping.position.copy(by[focus].local); ping.scale.setScalar(by[focus].size * (1.4 + ph * 3)); pm.opacity = 0.9 * (1 - ph); }
    else pm.opacity = 0;

    renderer.render(scene, cam);
  };
  raf = requestAnimationFrame(frame);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); };
}
