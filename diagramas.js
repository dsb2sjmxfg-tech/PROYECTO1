/* ==========================================================
   diagramas.js: muestra los 4 diagramas del proyecto en pestañas.
   Los diagramas se escriben como texto (lenguaje Mermaid) y la
   librería Mermaid los convierte en dibujos.
   main.js llama a window.iniciarDiagramas cuando llegas a la sección.
   ========================================================== */
(function () {
  /* Un diagrama por pestaña. Puedes editar el texto para cambiar el dibujo. */
  const D = {
    'Casos de uso': `flowchart LR
 U([Usuario])-->a1[Conectarse y desconectarse]
 U-->a2[Enviar y recibir mensajes]
 U-->a3[Recargar y consultar saldo]
 U-->a4[Activar y desactivar desvío]
 A([Administrador])-->b1[Consultar usuarios]
 A-->b2[Ver estadísticas de uso]
 S([Sistema])-->c1[Enviar saldo y errores]`,

    'Clases': `classDiagram
 class Persona{+id +nombre +apellidos +direccion +datosBancarios}
 class Telefono{+id +saldo +estado +desvioA +encender() +apagar() +recargar() +desviar()}
 class Mensaje{+id +texto +costo +fecha}
 class Tarifa{+costo +franjaHoraria}
 Persona "1" --> "*" Telefono
 Telefono "1" --> "*" Mensaje : envía
 Tarifa "1" --> "*" Mensaje`,

    'Actividades': `flowchart TD
 I((Inicio))-->E[Usuario envía mensaje]-->Q{¿Teléfono encendido?}
 Q-- No -->R1[Error: teléfono apagado]
 Q-- Sí -->Z{¿Saldo suficiente?}
 Z-- No -->R2[Error: saldo insuficiente]
 Z-- Sí -->P[Descontar costo]-->V{¿Destino con desvío?}
 V-- Sí -->W[Entregar al destino final]-->F((Fin))
 V-- No -->X[Entregar al destino]-->F`,

    'Entidad-relación': `erDiagram
 PERSONA ||--o{ TELEFONO : posee
 TELEFONO ||--o{ MENSAJE : envia
 TELEFONO ||--o| TELEFONO : desvia_a
 TARIFA ||--o{ MENSAJE : aplica
 PERSONA{int id string nombre string apellidos string direccion string datos_bancarios}
 TELEFONO{int id int persona_id decimal saldo bool conectado int desvio_id}
 MENSAJE{int id int origen_id int destino_id string texto decimal costo datetime fecha}
 TARIFA{int id decimal costo string franja}`
  };

  /* Descarga Mermaid (una sola vez) y dibuja el diagrama pedido dentro de c */
  async function dibujar(nombre, c) {
    c.innerHTML = '<p>Dibujando diagrama…</p>';
    try {
      if (!window.mermaid) {
        await window.cargarScript('https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js');
        window.mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
      }
      const { svg } = await window.mermaid.render('m' + Date.now(), D[nombre]);
      c.innerHTML = svg;
      c.setAttribute('aria-label', 'Diagrama de ' + nombre);
    } catch (e) {
      c.innerHTML = '<p class="fail">No se pudo dibujar el diagrama. Revisa tu conexión a internet y cambia de pestaña para reintentar.</p>';
    }
  }

  /* Crea las pestañas y muestra el primer diagrama */
  window.iniciarDiagramas = function (box) {
    box.innerHTML = '<div class="tabs" role="tablist"></div><div class="dgm" role="img" aria-live="polite"></div>';
    const tabs = box.firstChild, c = box.lastChild;
    Object.keys(D).forEach((k, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.role = 'tab'; b.textContent = k;
      b.setAttribute('aria-selected', i === 0);
      tabs.append(b);
    });
    /* Al tocar una pestaña: márcala y dibuja su diagrama */
    tabs.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      [...tabs.children].forEach(x => x.setAttribute('aria-selected', x === b));
      dibujar(b.textContent, c);
    });
    return dibujar(Object.keys(D)[0], c);
  };
})();