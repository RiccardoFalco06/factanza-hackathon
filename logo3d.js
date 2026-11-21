// La F di Factanza in 3D: dieci tessere colorate sopra un corpo blu notte che scende a punta.
// Se il 3D non parte (niente WebGL, niente rete) resta visibile l'immagine piatta.
import * as THREE from 'three';

// Forma, colori e inclinazione misurati sulla favicon di factanza.com.
const NAVY = 0x1a1d56;
const TILES = [ // [colonna, riga, colore]
  [0, 0, 0xd7007f], [1, 0, 0x831f82], [2, 0, 0x0075bf], [3, 0, 0x009fe3],
  [0, 1, 0xea5b0c],
  [0, 2, 0xf7a600], [1, 2, 0xffe000], [2, 2, 0xc8d400],
  [0, 3, 0x00aca9],
  [0, 4, 0x009469],
];
const OUTLINE = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 2], [3, 2], [3, 3], [1, 3], [1, 5], [0, 5]]; // contorno della F
const APEX = [0, -8, 5]; // la punta sta sotto il piede della F
// Posa di base = il logo com'è disegnato: dove puntano sullo schermo i tre assi della F (destra, alto, verso chi guarda).
const POSE = new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0.743, 0.215, -0.634), new THREE.Vector3(0.361, 0.668, 0.650), new THREE.Vector3(0.563, -0.712, 0.419));
const FLAT = { x: 0.732, y: -0.507 }; // giro che mette le tessere di fronte a chi guarda (ricavato da POSE): la F sembra 2D
const HOLD = 0.7, TURN = 1.8; // secondi: quanto resta piatta, quanto dura il passaggio al 3D
const W = 10.5, H = 11.5; // spazio che la F occupa in qualsiasi giro, in tessere: sta sempre dentro il riquadro

const el = document.querySelector('.logo3d');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { /* resta l'immagine piatta */ }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  el.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(14, 1, 1, 2000); // campo stretto: quasi senza prospettiva, come nel logo

  const item = new THREE.Group();
  const tile = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  for (const [x, z, color] of TILES) {
    const m = new THREE.Mesh(tile, new THREE.MeshBasicMaterial({ color }));
    m.position.set(x + 0.5, 0, z + 0.5);
    item.add(m);
  }
  // corpo: da ogni lato del contorno una faccia che scende fino alla punta
  const walls = OUTLINE.flatMap(([x, z], i) => {
    const [x2, z2] = OUTLINE[(i + 1) % OUTLINE.length];
    return [x, 0, z, x2, 0, z2, ...APEX];
  });
  const body = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(walls, 3));
  body.computeVertexNormals();
  item.add(new THREE.Mesh(body, new THREE.MeshLambertMaterial({ color: NAVY })));
  // Luce messa in modo che nella posa del logo i fianchi visibili ricevano tutti la stessa luce: blu pieno, come nel logo.
  // Appena la F gira, le facce prendono toni diversi e si legge il volume.
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI * 0.85);
  sun.position.set(-1, 0.12, 1).applyMatrix4(POSE);
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.4), sun);

  item.quaternion.setFromRotationMatrix(POSE);
  item.position.sub(new THREE.Box3().setFromObject(item).getCenter(new THREE.Vector3())); // gira attorno al suo centro
  const rig = new THREE.Group();
  rig.add(item);
  scene.add(rig);

  let px = 0, py = 0, rx = 0, ry = 0, t0 = null, last = 0, drag = null;
  // l'avvio parte solo quando la pagina è davvero davanti a chi guarda: scheda visibile e finestra in primo piano
  const seen = () => document.visibilityState === 'visible' && document.hasFocus();
  document.addEventListener('visibilitychange', () => { if (document.hidden) t0 = null; }); // tornando sulla scheda riparte da piatta
  addEventListener('pointermove', e => {
    if (drag) { // trascinando gira libera: in orizzontale fa il giro completo, in verticale si inclina
      ry += (e.clientX - drag.x) * 0.01;
      rx = THREE.MathUtils.clamp(rx + (e.clientY - drag.y) * 0.01, -1.2, 1.2);
      drag = { x: e.clientX, y: e.clientY };
      if (still) draw(performance.now());
    } else if (e.pointerType === 'mouse') {
      const r = el.getBoundingClientRect();
      px = THREE.MathUtils.clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      py = THREE.MathUtils.clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
    }
  });
  el.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
  });
  const drop = () => {
    drag = null;
    ry -= Math.PI * 2 * Math.round(ry / (Math.PI * 2)); // al rilascio torna alla posa del logo per la via più breve
    el.classList.remove('is-dragging');
  };
  el.addEventListener('pointerup', drop);
  el.addEventListener('pointercancel', drop);

  const draw = now => {
    if (t0 === null && seen()) t0 = now;
    const t = t0 === null ? 0 : (now - t0) / 1000, dt = Math.min(Math.max(t - last, 0), 0.1);
    last = t;
    // all'avvio la F è piatta e ferma, come un logo 2D; dopo una pausa si gira fino alla posa del logo, poi oscilla piano
    const k = still ? 1 : THREE.MathUtils.smootherstep(t, HOLD, HOLD + TURN), move = still ? 0 : k;
    if (!drag) { // senza trascinare segue il mouse con giri piccoli, così la F resta riconoscibile
      const f = 1 - Math.exp(-dt * 4);
      rx += (py * 0.12 * k - rx) * f;
      ry += (px * 0.22 * k - ry) * f;
    }
    rig.rotation.set(rx + (1 - k) * FLAT.x + Math.sin(t * 0.7) * 0.04 * move, ry + (1 - k) * FLAT.y + Math.sin(t * 0.45) * 0.08 * move, 0);
    rig.position.y = Math.sin(t * 0.9) * 0.12 * move;
    renderer.render(scene, camera);
  };

  new ResizeObserver(() => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // distanza della camera scelta perché la F stia nel riquadro, su telefono e su schermo largo
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(W / (2 * tan * camera.aspect), H / (2 * tan));
    camera.updateProjectionMatrix();
    draw(performance.now());
    el.classList.add('is-3d');
  }).observe(el);

  // fermo quando esce dallo schermo; uscita del tutto, al ritorno rifà l'avvio da piatta. Con "riduci movimento" resta la posa 3D
  if (!still) new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) t0 = null, last = 0;
    renderer.setAnimationLoop(e.isIntersecting ? draw : null);
  }).observe(el);
}
