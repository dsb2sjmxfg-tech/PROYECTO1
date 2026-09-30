/* ==========================================================
   simulador.js: la central de mensajería interactiva.
   Todo va dentro de una función que se ejecuta sola (IIFE)
   para no chocar con los nombres de main.js.
   main.js llama a window.iniciarSimulador cuando llegas a la sección.
   ========================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);

  /* Los 3 teléfonos de la central.
     on: encendido (1) o apagado (0) | saldo en pesos | d: a quién desvía (o null) */
  const S = {
    A: { n: 'Ana',   on: 0, saldo: 20, d: null },
    B: { n: 'Beto',  on: 0, saldo: 5,  d: null },
    C: { n: 'Carla', on: 0, saldo: 10, d: null }
  };

  /* Costo del mensaje: $2 de 8:00 a 20:00, $1 fuera de ese horario */
  const costo = () => { const h = new Date().getHours(); return h >= 8 && h < 20 ? 2 : 1; };

  let out; /* la consola donde aparecen los eventos */

  /* Agrega una línea a la consola. c = clase de color ('sys' o 'err') */
  function log(m, c = '') {
    const d = document.createElement('div');
    d.className = c;
    d.textContent = `[${new Date().toLocaleTimeString()}] ${m}`;
    out.append(d);
    out.scrollTop = out.scrollHeight;
  }
  /* Mensajes automáticos del sistema hacia un usuario */
  const sys = (id, m) => log(`Sistema a ${S[id].n}: ${m}`, 'sys');
  const err = (id, m) => log(`Sistema a ${S[id].n}: ERROR, ${m}`, 'err');

  /* Genera las <option> de los menús desplegables */
  const opts = () => Object.entries(S).map(([i, t]) => `<option value="${i}">${t.n}</option>`).join('');

  /* Sigue la cadena de desvíos hasta el teléfono final que recibe el mensaje */
  const final = id => {
    const visto = new Set();
    while (S[id].d && !visto.has(id)) { visto.add(id); id = S[id].d; }
    return id;
  };

  /* Dibuja las tarjetas de los teléfonos con su estado actual */
  function draw() {
    $('#tels').innerHTML = Object.entries(S).map(([id, t]) => `
      <article class="tel${t.on ? ' on' : ''}">
        <h3>${t.n}</h3>
        <p>${t.on ? 'Conectado' : 'Desconectado'}. Saldo $${t.saldo}. Desvío: ${t.d ? S[t.d].n : 'ninguno'}.</p>
        <div class="row">
          <button class="chip" data-a="on" data-id="${id}">Encender</button>
          <button class="chip" data-a="off" data-id="${id}">Apagar</button>
          <button class="chip" data-a="rec" data-id="${id}">Recargar $10</button>
          <button class="chip" data-a="sal" data-id="${id}">Ver saldo</button>
        </div>
        <div class="row">
          <select id="d${id}" aria-label="Desviar ${t.n} a">${opts()}</select>
          <button class="chip" data-a="des" data-id="${id}">Desviar</button>
          <button class="chip" data-a="qd" data-id="${id}">Quitar desvío</button>
        </div>
      </article>`).join('');
  }

  /* Ejecuta una acción de un teléfono. Aquí están los 5 errores que pide el PDF. */
  function accion(a, id) {
    const t = S[id];
    if (a === 'on') {
      if (t.on) return err(id, 'el teléfono ya estaba encendido.');          /* Error 4 */
      t.on = 1; log(`${t.n} se conectó.`);
    }
    if (a === 'off') {
      if (!t.on) return err(id, 'el teléfono ya estaba apagado.');           /* Error 5 */
      t.on = 0; log(`${t.n} se desconectó.`);
    }
    if (a === 'rec') { t.saldo += 10; sys(id, `recarga aplicada. Saldo actual: $${t.saldo}.`); }
    if (a === 'sal') sys(id, `tu saldo actual es $${t.saldo}.`);
    if (a === 'qd') { t.d = null; log(`${t.n} quitó su desvío.`); }
    if (a === 'des') {
      const to = $('#d' + id).value;
      if (to === id) return err(id, 'no puedes desviar el teléfono a sí mismo.'); /* Error 1 */
      /* Error 2: si al seguir los desvíos volvemos a este teléfono, habría un ciclo */
      let x = to; const visto = new Set();
      while (x && !visto.has(x)) {
        if (x === id) return err(id, 'ese desvío crearía un ciclo.');
        visto.add(x); x = S[x].d;
      }
      t.d = to; log(`${t.n} desvió sus mensajes a ${S[to].n}.`);
    }
    draw();
  }

  /* Función que main.js llama al llegar a la sección. box = el <div class="mount"> */
  window.iniciarSimulador = function (box) {
    box.innerHTML = `
      <div id="tels" class="tels"></div>
      <form id="fEnvio" class="envio" novalidate>
        <label>De<select id="de">${opts()}</select></label>
        <label>Para<select id="para">${opts()}</select></label>
        <label>Mensaje<input id="txt" maxlength="140" required></label>
        <button class="pill blue" type="submit">Enviar</button>
      </form>
      <div id="out" role="log" aria-live="polite"></div>`;
    out = $('#out');
    $('#para').selectedIndex = 1; /* por defecto: de Ana para Beto */
    draw();

    /* Un solo "oyente" para todos los botones de las tarjetas */
    $('#tels').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) accion(b.dataset.a, b.dataset.id);
    });

    /* Envío de mensajes */
    $('#fEnvio').addEventListener('submit', e => {
      e.preventDefault();
      const de = $('#de').value, para = $('#para').value, txt = $('#txt'), c = costo();
      if (!txt.value.trim()) { txt.setAttribute('aria-invalid', true); return log('Escribe un mensaje antes de enviar.', 'err'); }
      txt.removeAttribute('aria-invalid');
      if (!S[de].on) return err(de, 'enciende tu teléfono antes de enviar.');
      if (S[de].saldo < c) return err(de, `saldo insuficiente. Cuesta $${c} y tienes $${S[de].saldo}.`); /* Error 3 */
      S[de].saldo -= c;
      const dest = final(para); /* teléfono que realmente recibe, tras los desvíos */
      log(`${S[de].n} a ${S[dest].n}${dest !== para ? ' (por desvío)' : ''}: ${txt.value}${S[dest].on ? '' : ' (pendiente: destino desconectado)'}`);
      sys(de, `mensaje enviado. Saldo actual: $${S[de].saldo}.`);
      e.target.reset();
      draw();
    });

    log('Central iniciada. Enciende un teléfono para comenzar.', 'sys');
  };
})();