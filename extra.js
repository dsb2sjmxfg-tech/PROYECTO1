/* ==========================================================
   extra.js: color por sección, barra de progreso, escena del
   flujo y tarjetas con inclinación.
   Va dentro de una función que se ejecuta sola (IIFE) para no
   chocar con los nombres de main.js.
   ========================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- 1. COLOR DE ACENTO POR SECCIÓN ----------
     Cuando una sección llega al centro de la pantalla, el color
     de toda la página cambia al suyo. Edita los colores aquí. */
  const COLOR = {
    inicio: '#2f5bff', resumen: '#8b5cf6', analisis: '#14b8a6', flujo: '#ff5c7a',
    simulador: '#22d3ee', modelados: '#f59e0b', desarrollo: '#22c55e', contacto: '#2f5bff'
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && COLOR[e.target.id]) root.style.setProperty('--acc', COLOR[e.target.id]);
  }), { rootMargin: '-45% 0px -45% 0px' });
  Object.keys(COLOR).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

  /* ---------- 2. BARRA DE PROGRESO Y ESCENA DEL FLUJO ---------- */
  const barra = $('.progress');
  const flow = $('#flujo');
  const pasos = flow ? $$('.flow-steps li', flow) : [];
  const relleno = flow ? $('.flow-bar i', flow) : null;
  const escena = flow ? $('.flow-stage', flow) : null;
  /* El color de cada paso se lee de su variable --c del HTML */
  const colores = pasos.map(li => getComputedStyle(li).getPropertyValue('--c').trim());

  function actualizar() {
    /* Barra de arriba: qué porcentaje de la página llevas */
    const total = root.scrollHeight - innerHeight;
    if (barra) barra.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;

    /* Escena del flujo: p va de 0 a 1 mientras la recorres */
    if (!flow || reduce) return;
    const h = flow.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -flow.getBoundingClientRect().top / h));
    const paso = Math.min(pasos.length - 1, Math.floor(p * pasos.length));
    relleno.style.width = p * 100 + '%';
    pasos.forEach((li, i) => {
      li.classList.toggle('on', i === paso);
      li.classList.toggle('done', i < paso);
    });
    escena.style.setProperty('--acc', colores[paso]);
  }
  let ocupado = false;
  addEventListener('scroll', () => {
    if (!ocupado) { ocupado = true; requestAnimationFrame(() => { ocupado = false; actualizar(); }); }
  }, { passive: true });
  addEventListener('resize', actualizar);
  actualizar();

  /* ---------- 3. TARJETAS CON INCLINACIÓN ----------
     Solo con mouse (no en celular) y si no pediste menos movimiento. */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const SEL = '.plan div,.cols div,.nums div,.tel';
    document.addEventListener('pointermove', e => {
      const c = e.target.closest(SEL);
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-3px)`;
    });
    document.addEventListener('pointerout', e => {
      const c = e.target.closest(SEL);
      if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
  }
})();