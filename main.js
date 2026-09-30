/* ==========================================================
   main.js: lo que hace funcionar toda la página.
   Es un script normal (no módulo) para que funcione al abrir
   index.html con doble clic, sin servidor.
   ========================================================== */

/* Atajos para buscar elementos: $ busca uno, $$ busca todos */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BASE = 'Central de Mensajería Móvil';
/* ¿La persona pidió menos animaciones en su sistema? */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. PANTALLA DE CARGA ----------
   Cuenta de 0 a 100 y luego se desvanece. */
const ld = $('#loader'), ln = $('.ld-num');
function hideLoader() {
  let n = 0;
  const t = setInterval(() => {
    n = Math.min(100, n + 8);
    ln.textContent = n;
    if (n === 100) { clearInterval(t); ld.classList.add('done'); }
  }, 25);
}
/* Si la página ya cargó, inicia; si no, espera al evento "load" */
document.readyState === 'complete' ? hideLoader() : addEventListener('load', hideLoader);
/* Seguro: a los 4 segundos la oculta pase lo que pase (por ejemplo, sin internet) */
setTimeout(() => ld.classList.add('done'), 4000);

/* ---------- 2. MENÚ DE CELULAR ---------- */
const mb = $('.menu-btn');
function menu(abierto) {
  document.body.classList.toggle('menu-open', abierto);
  mb.setAttribute('aria-expanded', abierto);
}
mb.addEventListener('click', () => menu(!document.body.classList.contains('menu-open')));
$$('#menu a').forEach(a => a.addEventListener('click', () => menu(false)));
addEventListener('keydown', e => e.key === 'Escape' && menu(false));

/* ---------- 3. TÍTULO ÚNICO POR SECCIÓN + ENLACE ACTIVO ----------
   Al hacer scroll, cambia el título de la pestaña y resalta el enlace del menú. */
const links = $$('.links a');
const tio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  document.title = `${e.target.dataset.title} | ${BASE}`;
  links.forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
}), { rootMargin: '-45% 0px -45% 0px' });
$$('[data-title]').forEach(s => tio.observe(s));

/* ---------- 4. ESCENA DEL TELÉFONO CON SCROLL ----------
   p va de 0 a 1 según cuánto has bajado por la escena.
   Con p se mueve el teléfono, el texto gigante y se cambia la pantalla. */
const story = $('.story'), stage = $('.stage'), phone = $('.phone'), marq = $('.marquee'), hero = $('.hero-copy');
const caps = $$('.cap'), panels = $$('.panel');
function frame() {
  const h = story.offsetHeight - innerHeight;
  const p = Math.min(1, Math.max(0, -story.getBoundingClientRect().top / h));
  const k = Math.min(1, p / .12), e = 1 - Math.pow(1 - k, 3);
  /* El título inicial se desvanece */
  hero.style.opacity = 1 - e;
  hero.style.transform = `translateY(${-e * 40}px)`;
  /* El teléfono sube, crece y se inclina */
  phone.style.transform = `translateY(${(1 - e) * 34}vh) scale(${.9 + .1 * e}) rotateY(${Math.sin(p * Math.PI * 3) * 10}deg) rotateZ(${Math.sin(p * Math.PI * 2) * -3}deg)`;
  /* Las palabras gigantes cruzan de derecha a izquierda */
  marq.style.opacity = e;
  marq.style.transform = `translate3d(${-p * (marq.scrollWidth - innerWidth)}px,0,0)`;
  /* Cuál de los 4 momentos se muestra (-1 = ninguno todavía) */
  const paso = p < .12 ? -1 : Math.min(3, Math.floor((p - .12) / .88 * 4));
  caps.forEach((c, i) => c.classList.toggle('on', i === paso));
  panels.forEach((c, i) => c.classList.toggle('on', i === Math.max(0, paso)));
  stage.classList.toggle('dark', paso >= 2);
}
if (!reduce) {
  let ocupado = false;
  /* requestAnimationFrame evita recalcular más de una vez por cuadro */
  addEventListener('scroll', () => {
    if (!ocupado) { ocupado = true; requestAnimationFrame(() => { ocupado = false; frame(); }); }
  }, { passive: true });
  addEventListener('resize', frame);
  frame();
}

/* ---------- 5. CONTADORES ANIMADOS (5, 4, 4, 3) ---------- */
const co = new IntersectionObserver((es, o) => es.forEach(e => {
  if (!e.isIntersecting) return;
  o.unobserve(e.target);
  const n = +e.target.dataset.n;
  if (reduce) { e.target.textContent = n; return; }
  const t0 = performance.now();
  (function paso(t) {
    const k = Math.min(1, (t - t0) / 1200);
    e.target.textContent = Math.round(n * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(paso);
  })(t0);
}), { threshold: .6 });
$$('[data-n]').forEach(el => { el.textContent = 0; co.observe(el); });

/* ---------- 6. CARGA BAJO DEMANDA (simulador y diagramas) ----------
   cargarScript descarga un archivo .js solo cuando hace falta. */
function cargarScript(src) {
  return new Promise((ok, fallo) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => fallo(new Error('No se pudo cargar ' + src));
    document.head.append(s);
  });
}
window.cargarScript = cargarScript; /* los otros archivos también la usan */

/* lazy: cuando la sección está a punto de verse, carga su archivo y la inicia.
   Mientras carga muestra un esqueleto; si falla, un botón "Reintentar". */
function lazy(id, archivo, funcionInicio) {
  const s = $('#' + id), box = $('.mount', s);
  const ir = () => {
    s.classList.add('loading');
    cargarScript(archivo)
      .then(() => window[funcionInicio](box))
      .then(() => s.classList.remove('loading'))
      .catch(() => {
        s.classList.remove('loading');
        box.innerHTML = '<p class="fail">No se pudo cargar esta sección. <button class="pill" type="button">Reintentar</button></p>';
        $('button', box).onclick = ir;
      });
  };
  new IntersectionObserver((es, o) => {
    if (es[0].isIntersecting) { o.disconnect(); ir(); }
  }, { rootMargin: '400px' }).observe(s);
}
lazy('simulador', 'simulador.js', 'iniciarSimulador');
lazy('modelados', 'diagramas.js', 'iniciarDiagramas');

/* ---------- 7. FORMULARIO DE CONTACTO ----------
   Revisa cada campo con las reglas del HTML (required, minlength, email). */
const f = $('#fContacto');
f.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  $$('input,textarea', f).forEach(i => {
    const mal = !i.checkValidity();
    i.setAttribute('aria-invalid', mal);
    $('.err', i.parentNode).textContent = mal ? i.dataset.err : '';
    if (mal) ok = false;
  });
  if (ok) {
    $('#okContacto').textContent = 'Mensaje validado. Conecta Formspree o EmailJS para recibirlo por correo.';
    f.reset();
  }
});

/* Registra en la consola cualquier error inesperado */
addEventListener('error', e => console.error('Error en la página:', e.message));