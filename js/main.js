/* ============================================================
   GAMEHUT — main.js (exclusivo del index)
   Genera el selector de áreas y el panel de minijuegos a partir
   de la configuración AREAS. Lee los récords SOLO en modo lectura
   a través de getScore() de js/scores.js.

   PARA AGREGAR UN ÁREA NUEVA EN EL FUTURO (ej. Meseros):
   1) Guarda su imagen como assets/img/area-5.jpg
   2) Copia uno de los bloques de AREAS, ajusta nombre, imagen,
      dificultad y su lista de juegos. Nada más. El index se
      reconstruye solo.
   ============================================================ */

/* ---------- CONFIGURACIÓN (editable) ---------- */
const AREAS = [
  {
    id: 'introductorios',
    nombre: 'Introductorios',
    emoji: '📋',
    dificultad: { texto: 'Fácil', clase: 'b-facil' },
    imagen: 'assets/img/area-1.jpg',
    descripcion: 'Teoría general de cocina: seguridad, limpieza y fundamentos del día a día.',
    juegos: [
      {
        num: 1,
        nombre: '¿Qué hago ahora?',
        desc: 'Toma decisiones rápidas ante situaciones reales de cocina',
        href: 'minijuego-1.html',
        // Si el récord no aparece o aparece mal, fija aquí la clave exacta
        // que usa scores.js (F12 → Application → Local Storage) así:
        // idsRecord: ['clave-exacta']
        idsRecord: []
      }
    ]
  },
  {
    id: 'ensambles',
    nombre: 'Ensambles',
    emoji: '🥗',
    dificultad: { texto: 'Medio', clase: 'b-medio' },
    imagen: 'assets/img/area-2.jpg',
    descripcion: 'Tosters, ensaladas y armados: detecta errores y domina cada técnica de corte.',
    juegos: [
      {
        num: 2,
        nombre: '¿Falta algo?',
        desc: 'Identifica ingredientes faltantes o incorrectos en el producto',
        href: 'minijuego-2.html',
        idsRecord: []
      },
      {
        num: 3,
        nombre: 'El corte correcto',
        desc: 'Elige la técnica de corte correcta para cada ingrediente',
        href: 'minijuego-3.html',
        idsRecord: []
      }
    ]
  },
  {
    id: 'pastas',
    nombre: 'Pastas y Entradas',
    emoji: '🍝',
    dificultad: { texto: 'Medio-Alto', clase: 'b-medio-alto' },
    imagen: 'assets/img/area-3.jpg',
    descripcion: 'La comanda llega y el tiempo corre: arma la pasta correcta como en la cocina real.',
    juegos: [
      {
        num: 4,
        nombre: 'El pedido llega',
        desc: 'Prepara la pasta correcta según la comanda en pantalla',
        href: 'minijuego-4.html',
        idsRecord: []
      }
    ]
  },
  {
    id: 'produccion',
    nombre: 'Producción',
    emoji: '🍕',
    dificultad: { texto: 'Difícil', clase: 'b-dificil' },
    imagen: 'assets/img/area-4.jpg',
    descripcion: 'El corazón de la marca: arma cada pizza en el orden exacto de ensamble.',
    juegos: [
      {
        num: 5,
        nombre: 'Arma el producto',
        desc: 'Arrastra los ingredientes en el orden exacto de ensamble',
        href: 'minijuego-5.html',
        idsRecord: []
      }
    ]
  }
];

/* Tiempo máximo aceptado como récord válido (misma salvaguarda del MJ4) */
const RECORD_MAX_SEGUNDOS = 1800; // 30 minutos

/* ---------- LECTURA DE RÉCORDS (solo lectura) ---------- */

/* Claves candidatas típicas para el minijuego N */
function candidatosPorNumero(n) {
  return [
    'minijuego-' + n,
    'minijuego' + n,
    'mj' + n,
    'mj-' + n,
    'juego-' + n,
    'juego' + n
  ];
}

/* Intenta extraer un tiempo en segundos desde cualquier formato guardado:
   número, "m:ss", string numérico u objeto con propiedades comunes. */
function extraerSegundos(dato) {
  if (dato === null || dato === undefined) return null;

  if (typeof dato === 'number') {
    if (isFinite(dato) && dato >= 0 && dato <= RECORD_MAX_SEGUNDOS) return dato;
    return null;
  }

  if (typeof dato === 'string') {
    const s = dato.trim();
    const mmss = s.match(/^(\d+):(\d{1,2})$/);
    if (mmss) {
      const total = parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
      return extraerSegundos(total);
    }
    const num = parseFloat(s);
    if (!isNaN(num)) return extraerSegundos(num);
    return null;
  }

  if (typeof dato === 'object') {
    const claves = [
      'tiempo', 'mejorTiempo', 'mejor_tiempo', 'time',
      'segundos', 'seconds', 'total', 'valor', 'value',
      'record', 'score'
    ];
    for (const k of claves) {
      if (k in dato) {
        const s = extraerSegundos(dato[k]);
        if (s !== null) return s;
      }
    }
  }

  return null;
}

/* Lee el récord de un juego: primero vía getScore() con las claves
   candidatas; si no aparece, rastrea localStorage como respaldo. */
function leerRecordJuego(juego) {
  const candidatos = (juego.idsRecord && juego.idsRecord.length)
    ? juego.idsRecord
    : candidatosPorNumero(juego.num);

  if (typeof getScore === 'function') {
    for (const id of candidatos) {
      try {
        const s = extraerSegundos(getScore(id));
        if (s !== null) return s;
      } catch (e) { /* clave inexistente: continuar */ }
    }
  }

  try {
    const patron = new RegExp('(mj|minijuego|juego)[^0-9]*' + juego.num + '(?![0-9])');
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (!clave) continue;
      const cl = clave.toLowerCase();
      if (!patron.test(cl)) continue;
      if (/(sonido|sound|mute|audio)/.test(cl)) continue; // no confundir con preferencia de sonido

      let dato = localStorage.getItem(clave);
      try { dato = JSON.parse(dato); } catch (e) { /* se queda como string */ }
      const s = extraerSegundos(dato);
      if (s !== null) return s;
    }
  } catch (e) { /* localStorage no disponible */ }

  return null;
}

/* Formato de tiempo: 42s si es menor a un minuto, m:ss en adelante */
function formatearTiempo(segundos) {
  const t = Math.round(segundos);
  if (t < 60) return t + 's';
  const m = Math.floor(t / 60);
  const r = t % 60;
  return m + ':' + String(r).padStart(2, '0');
}

/* ---------- RENDER ---------- */

const $selector = document.getElementById('selector-areas');
const $detalle = document.getElementById('detalle-area');
let areaActivaId = null;

function esc(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function fondoArea(area) {
  /* Capas (de arriba hacia abajo): overlay oscuro → foto del área →
     degradado de respaldo por si la imagen no existe. */
  return "linear-gradient(180deg, rgba(17,17,17,0.30) 0%, rgba(17,17,17,0.55) 45%, rgba(17,17,17,0.92) 100%), " +
         "url('" + area.imagen + "'), " +
         "radial-gradient(120% 140% at 18% 0%, #3b1717 0%, #191919 70%)";
}

function renderSelector() {
  $selector.innerHTML = AREAS.map(function (area) {
    const n = area.juegos.length;
    return (
      '<button class="area-card reveal" role="tab" id="tab-' + area.id + '" ' +
        'aria-selected="false" tabindex="-1" aria-controls="detalle-area" ' +
        'data-area="' + area.id + '" ' +
        'style="background-image:' + fondoArea(area) + '">' +
        '<span class="badge ' + area.dificultad.clase + '">' + esc(area.dificultad.texto) + '</span>' +
        '<span class="area-nombre">' + esc(area.nombre) + '</span>' +
        '<span class="area-meta">' + n + (n === 1 ? ' minijuego' : ' minijuegos') + '</span>' +
      '</button>'
    );
  }).join('');

  $selector.querySelectorAll('.area-card').forEach(function (btn) {
    btn.addEventListener('click', function () {
      seleccionarArea(btn.dataset.area, true);
    });
  });

  /* Navegación con flechas dentro del selector (patrón de tabs) */
  $selector.addEventListener('keydown', function (ev) {
    const teclas = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!teclas.includes(ev.key)) return;
    ev.preventDefault();

    const tabs = Array.from($selector.querySelectorAll('.area-card'));
    let i = tabs.indexOf(document.activeElement);
    if (i < 0) i = tabs.findIndex(function (t) { return t.dataset.area === areaActivaId; });

    if (ev.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
    if (ev.key === 'ArrowRight') i = (i + 1) % tabs.length;
    if (ev.key === 'Home') i = 0;
    if (ev.key === 'End') i = tabs.length - 1;

    tabs[i].focus();
    seleccionarArea(tabs[i].dataset.area, true);
  });
}

function renderDetalle(area) {
  const juegosHTML = area.juegos.map(function (juego, i) {
    const record = leerRecordJuego(juego);
    const chip = (record === null)
      ? '<span class="record-valor sin">—</span>'
      : '<span class="record-valor con">★ ' + formatearTiempo(record) + '</span>';

    return (
      '<a class="juego-card reveal" href="' + juego.href + '" ' +
        'style="transition-delay:' + (i * 70) + 'ms">' +
        '<span class="juego-nombre">' + esc(juego.nombre) + '</span>' +
        '<span class="juego-desc">' + esc(juego.desc) + '</span>' +
        '<span class="juego-foot">' +
          '<span class="record">Récord' + chip + '</span>' +
          '<span class="flecha" aria-hidden="true">→</span>' +
        '</span>' +
      '</a>'
    );
  }).join('');

  $detalle.innerHTML =
    '<div class="detalle-head">' +
      '<span class="detalle-emoji" aria-hidden="true">' + area.emoji + '</span>' +
      '<h3>' + esc(area.nombre) + '</h3>' +
      '<span class="badge ' + area.dificultad.clase + '">' + esc(area.dificultad.texto) + '</span>' +
    '</div>' +
    '<p class="detalle-desc">' + esc(area.descripcion) + '</p>' +
    '<div class="juegos-grid">' + juegosHTML + '</div>';

  $detalle.setAttribute('aria-labelledby', 'tab-' + area.id);
  activarReveal($detalle);
}

function seleccionarArea(id, esClicUsuario) {
  const area = AREAS.find(function (a) { return a.id === id; });
  if (!area || id === areaActivaId) return;
  areaActivaId = id;

  $selector.querySelectorAll('.area-card').forEach(function (btn) {
    const activa = btn.dataset.area === id;
    btn.classList.toggle('activa', activa);
    btn.setAttribute('aria-selected', activa ? 'true' : 'false');
    btn.setAttribute('tabindex', activa ? '0' : '-1');
  });

  renderDetalle(area);

  /* En móvil, acercar el panel al hacer clic (no en la carga inicial) */
  if (esClicUsuario && window.innerWidth < 820) {
    $detalle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* Activa la animación de entrada de los elementos .reveal de un contenedor */
function activarReveal(contenedor) {
  const elementos = contenedor.querySelectorAll('.reveal:not(.in)');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      elementos.forEach(function (el) { el.classList.add('in'); });
    });
  });
}

/* ---------- ARRANQUE ---------- */
document.addEventListener('DOMContentLoaded', function () {
  renderSelector();

  /* Entrada escalonada de las tarjetas de área */
  $selector.querySelectorAll('.area-card').forEach(function (el, i) {
    el.style.transitionDelay = (i * 70) + 'ms';
  });
  activarReveal($selector);

  /* Área inicial: la primera (Introductorios) */
  seleccionarArea(AREAS[0].id, false);
});