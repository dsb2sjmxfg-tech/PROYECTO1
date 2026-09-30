/* ==========================================================
   extra.js: fondo 3D, color por sección, animaciones de toda
   la página, cursor, botones magnéticos y menú móvil.
   Va dentro de una función que se ejecuta sola (IIFE) para no
   chocar con los nombres de main.js.
   ========================================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const root = document.documentElement;
  const movil = innerWidth < 820;

  /* ---------- 1. COLOR POR SECCIÓN + PUNTOS LATERALES ----------
     Edita los colores aquí. Cuando una sección llega al centro,
     toda la página toma su color. */
  const COLOR = {
    inicio: '#2f5bff', resumen: '#8b5cf6', analisis: '#14b8a6', flujo: '#ff5c7a',
    simulador: '#22d3ee', modelados: '#f59e0b', desarrollo: '#22c55e', contacto: '#2f5bff'
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const acc = hex(COLOR.inicio), meta = acc.slice(); /* color actual y color al que se acerca */

  /* Indicador de capítulos a la derecha (como en el video) */
  const CAP = [['inicio', 'Inicio'], ['analisis', 'Análisis'], ['flujo', 'El viaje'], ['simulador', 'Simulador'],
               ['modelados', 'Modelados'], ['desarrollo', 'Desarrollo'], ['contacto', 'Contacto']];
  const dots = document.createElement('nav');
  dots.className = 'dots';
  dots.setAttribute('aria-label', 'Capítulos');
  dots.innerHTML = CAP.map(([id, t]) => `<a href="#${id}" data-l="${t}" aria-label="${t}"></a>`).join('');
  document.body.append(dots);

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    if (COLOR[id]) { root.style.setProperty('--acc', COLOR[id]); const c = hex(COLOR[id]); meta[0] = c[0]; meta[1] = c[1]; meta[2] = c[2]; }
    $$('a', dots).forEach(a => a.classList.toggle('on', a.hash === '#' + id));
  }), { rootMargin: '-45% 0px -45% 0px' });
  Object.keys(COLOR).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

  /* ---------- 2. FONDO 3D: RED DE SEÑAL ----------
     Nodos con posición (x, y, z). La cámara avanza en z: siempre despacio
     y más rápido cuanto más rápido haces scroll (deja estelas).
     El mouse mueve la cámara para dar profundidad. */
  const cv = document.createElement('canvas');
  cv.className = 'space';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const g = cv.getContext('2d');
  let W, H, D;
  const size = () => { D = Math.min(2, devicePixelRatio || 1); W = cv.width = innerWidth * D; H = cv.height = innerHeight * D; };
  addEventListener('resize', size); size();

  const N = movil ? 70 : 150, DEPTH = 1800;
  const nodos = Array.from({ length: N }, () => ({
    x: (Math.random() - .5) * 2600, y: (Math.random() - .5) * 1700, z: Math.random() * DEPTH
  }));
  let cam = 0, vel = 0, ultimo = scrollY, mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  function pintar() {
    vel += ((scrollY - ultimo) - vel) * .12; ultimo = scrollY; /* velocidad de scroll suavizada */
    if (!reduce) cam += 1.1 + vel * 1.4;
    for (let i = 0; i < 3; i++) acc[i] += (meta[i] - acc[i]) * .05; /* el color cambia suave */
    const c = acc.map(Math.round).join(',');
    g.clearRect(0, 0, W, H);
    const f = 520 * D, cx = mx * 380, cy = my * 240, estela = Math.min(320, Math.abs(vel) * 16);
    /* Proyección 3D -> 2D: cuanto más lejos (z), más pequeño y más cerca del centro */
    const P = nodos.map(n => {
      const z = ((n.z - cam) % DEPTH + DEPTH) % DEPTH + 30;
      const k = f / (z + 120), k2 = f / (z + estela + 120);
      return { x: W / 2 + (n.x - cx) * k, y: H / 2 + (n.y - cy) * k, k, a: 1 - z / DEPTH,
               x2: W / 2 + (n.x - cx) * k2, y2: H / 2 + (n.y - cy) * k2 };
    });
    /* Líneas entre nodos cercanos en pantalla */
    g.lineWidth = D;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      for (let j = i + 1; j < i + 6 && j < N; j++) {
        const q = P[j], dx = p.x - q.x, dy = p.y - q.y;
        if (dx * dx + dy * dy < (190 * D) ** 2) {
          g.strokeStyle = `rgba(${c},${.28 * Math.min(p.a, q.a)})`;
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
        }
      }
    }
    /* Nodos y estelas de velocidad */
    for (const p of P) {
      if (estela > 8) {
        g.strokeStyle = `rgba(${c},${p.a})`; g.lineWidth = Math.max(1, p.k * 1.4);
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x2, p.y2); g.stroke();
      }
      g.fillStyle = `rgba(${c},${.15 + .85 * p.a})`;
      g.beginPath(); g.arc(p.x, p.y, Math.max(.6 * D, p.k * 1.4), 0, 7); g.fill();
    }
    if (!reduce) requestAnimationFrame(pintar);
  }
  pintar();

  /* ---------- 3. SCROLL: BARRA, PARALLAX Y ESCENA DEL FLUJO ---------- */
  const barra = $('.progress'), blks = $$('.blk');
  const flow = $('#flujo'), pasos = flow ? $$('.flow-steps li', flow) : [];
  const relleno = flow ? $('.flow-bar i', flow) : null, escena = flow ? $('.flow-stage', flow) : null;
  const colores = pasos.map(li => getComputedStyle(li).getPropertyValue('--c').trim());

  function mover() {
    const total = root.scrollHeight - innerHeight;
    if (barra) barra.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
    /* --p: dónde está cada sección respecto al centro de la pantalla (-1 a 1) */
    blks.forEach(b => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--p', Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)).toFixed(3));
    });
    if (!flow || reduce) return;
    const h = flow.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -flow.getBoundingClientRect().top / h));
    const paso = Math.min(pasos.length - 1, Math.floor(p * pasos.length));
    relleno.style.width = p * 100 + '%';
    pasos.forEach((li, i) => { li.classList.toggle('on', i === paso); li.classList.toggle('done', i < paso); });
    escena.style.setProperty('--acc', colores[paso]);
  }
  let ocupado = false;
  addEventListener('scroll', () => {
    if (!ocupado) { ocupado = true; requestAnimationFrame(() => { ocupado = false; mover(); }); }
  }, { passive: true });
  addEventListener('resize', mover); mover();

  /* ---------- 4. ANIMACIONES DE ENTRADA EN TODA LA PÁGINA ---------- */
  /* Títulos: separa cada palabra para que suba con retraso */
  $$('.blk h2,.flow-stage h2').forEach(h => {
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = h.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
    h.classList.add('split-h');
  });
  /* Bloques: alternan lado y se escalonan */
  $$('.lead,details,.plan>div,.cols>div,.nums>div,.form>*,.mount').forEach((el, i) => {
    el.classList.add('rv');
    const pos = [...el.parentNode.children].indexOf(el);
    el.style.setProperty('--d', (pos % 6) * 90 + 'ms');
    el.style.setProperty('--dx', pos % 2 ? '40px' : '-40px');
  });
  const rio = new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return;
    o.unobserve(e.target);
    e.target.classList.add('in');
    /* Al terminar la entrada, la transición se acorta para que la inclinación con el mouse sea ágil */
    e.target.addEventListener('transitionend', ev => { if (ev.propertyName === 'transform') e.target.classList.add('done'); }, { once: true });
  }), { threshold: .15 });
  $$('.split-h,.rv').forEach(el => rio.observe(el));

  /* ---------- 5. INTERACCIÓN CON EL MOUSE (solo con mouse, no en celular) ---------- */
  if (!reduce && fine) {
    /* Anillo que sigue al cursor y crece sobre botones y enlaces */
    const cur = document.createElement('div');
    cur.className = 'cur';
    cur.setAttribute('aria-hidden', 'true');
    document.body.append(cur);
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    (function seguir() { x += (tx - x) * .18; y += (ty - y) * .18; cur.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(seguir); })();
    document.addEventListener('pointerover', e => cur.classList.toggle('big', !!e.target.closest('a,button,summary,input,select,textarea,label')));

    /* Botones magnéticos y tarjetas que se inclinan */
    const TILT = '.plan div,.cols div,.nums div,.tel', MAG = '.pill,.cta';
    document.addEventListener('pointermove', e => {
      const b = e.target.closest(MAG);
      if (b) { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .35}px`; }
      const c = e.target.closest(TILT);
      if (c) {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(800px) rotateX(${-py * 8}deg) rotateY(${px * 8}deg) translateY(-3px)`;
      }
    });
    document.addEventListener('pointerout', e => {
      const b = e.target.closest(MAG); if (b && !b.contains(e.relatedTarget)) b.style.translate = '';
      const c = e.target.closest(TILT); if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
  }

  /* ---------- 6. MENÚ MÓVIL: el botón cambia a "Cerrar" ---------- */
  const mb = $('.menu-btn');
  new MutationObserver(() => {
    const abierto = document.body.classList.contains('menu-open');
    mb.textContent = abierto ? 'Cerrar' : 'Menú';
    mb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
