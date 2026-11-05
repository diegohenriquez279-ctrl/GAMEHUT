/* ============================================================
   PROJECT GAMEHUT — Minijuego 4 (variante): El pedido llega · Práctica libre
   Motor del juego

   Misma mecánica que el MJ4 (mismas recetas, mesa, pyrex y
   tap-to-place), pero SIN reloj en contra:
     - Se elige UNA pasta.
     - Cuenta regresiva 3-2-1 y arranca un cronómetro que sube.
     - Un error no penaliza tiempo ni termina la comanda: solo se cuenta.
     - Récord = mejor tiempo POR PASTA (gamehut_score_pedido-libre).

   Reutiliza sin modificarlos: RECETAS_MJ4, INGREDIENTES_MESA_MJ4
   (js/comandas-mj4.js) y GameHutSVG_MJ4 (js/mj4-svg-library.js).
   ============================================================ */

(function() {
  'use strict';

  // Clave de récords (vía scores.js → "gamehut_score_pedido-libre").
  // Se guarda { porPasta: { <idReceta>: { ms, errores, fecha } } }.
  const ID_RECORDS = 'pedido-libre';
  const TIEMPO_MAXIMO_RAZONABLE_MS = 30 * 60 * 1000; // 30 min: descarta valores corruptos
  const PAUSA_FINAL_MS = 900;                         // se ve el pyrex terminado antes del resultado

  // ============================================================
  // ESTADO DEL JUEGO
  // ============================================================
  const estado = {
    enJuego: false,        // true solo mientras corre el cronómetro (mesa habilitada)
    receta: null,          // receta elegida
    pasoActual: 0,
    errores: 0,
    inicio: 0,             // performance.now() al arrancar el cronómetro
    tiempoMs: 0,
    rafId: null,
    timeouts: [],          // cuenta regresiva y pausa final (para poder cancelarlos)
    silenciado: false,
    audioContext: null
  };

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  document.addEventListener('DOMContentLoaded', inicializar);

  function inicializar() {
    estado.silenciado = leerPreferenciaMute();
    actualizarBotonSonido();

    document.getElementById('btn-comenzar').addEventListener('click', irAElegir);
    document.getElementById('btn-volver-intro').addEventListener('click', irAIntro);
    document.getElementById('btn-abandonar').addEventListener('click', confirmarAbandono);
    document.getElementById('btn-repetir').addEventListener('click', function() {
      if (estado.receta) iniciarPasta(estado.receta);
    });
    document.getElementById('btn-otra-pasta').addEventListener('click', irAElegir);
    document.querySelectorAll('.js-btn-sonido').forEach(function(btn) {
      btn.addEventListener('click', toggleSonido);
    });

    // Tap-to-place: tocar el pyrex coloca la ficha seleccionada
    document.getElementById('pyrex-display').addEventListener('click', manejarTapPyrex);

    construirMesaTrabajo();
    actualizarResumenRecords();
    mostrarEstado('intro');
  }

  // ============================================================
  // CONTROL DE PANTALLAS
  // ============================================================
  function mostrarEstado(nombreEstado) {
    document.querySelectorAll('.estado-pantalla').forEach(function(el) { el.classList.add('oculto'); });
    document.getElementById('estado-' + nombreEstado).classList.remove('oculto');
    window.scrollTo(0, 0);
  }

  function irAIntro() {
    actualizarResumenRecords();
    mostrarEstado('intro');
  }

  function irAElegir() {
    detenerTodo();
    construirGridPastas();
    mostrarEstado('elegir');
  }

  // ============================================================
  // PANTALLA "ELEGÍ LA PASTA"
  // ============================================================
  function construirGridPastas() {
    const grid = document.getElementById('grid-pastas');
    grid.innerHTML = '';

    RECETAS_MJ4.forEach(function(receta, i) {
      const record = recordDe(receta.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'pasta-card';
      card.style.animationDelay = (i * 45) + 'ms';
      card.setAttribute('aria-label', receta.nombre + ', ' + receta.pasos.length + ' ingredientes' +
        (record ? ', récord ' + formatearCrono(record.ms) : ', sin récord'));

      // Miniatura: el estado final del pyrex de esa receta.
      // Los IDs internos del SVG se prefijan para no chocar con el pyrex del juego.
      const thumb = document.createElement('span');
      thumb.className = 'pasta-thumb';
      const idFinal = receta.secuenciaVisual[receta.secuenciaVisual.length - 1];
      thumb.innerHTML = prefijarIdsSvg(GameHutSVG_MJ4.obtener(idFinal) || '', 'thumb-' + i + '-');

      const nombre = document.createElement('span');
      nombre.className = 'pasta-nombre';
      nombre.textContent = receta.nombre;

      const meta = document.createElement('span');
      meta.className = 'pasta-meta';
      meta.textContent = receta.pasos.length + ' ingredientes';

      const rec = document.createElement('span');
      rec.className = 'pasta-record' + (record ? ' con' : '');
      rec.textContent = record ? '★ ' + formatearCrono(record.ms) : 'Sin récord';

      card.appendChild(thumb);
      card.appendChild(nombre);
      card.appendChild(meta);
      card.appendChild(rec);
      card.addEventListener('click', function() { iniciarPasta(receta); });
      grid.appendChild(card);
    });
  }

  /* Prefija id="…", url(#…) y href="#…" de un SVG en texto para poder
     insertarlo varias veces en la misma página sin IDs duplicados. */
  function prefijarIdsSvg(svg, prefijo) {
    return svg
      .replace(/\bid="([^"]+)"/g, 'id="' + prefijo + '$1"')
      .replace(/url\(#([^)]+)\)/g, 'url(#' + prefijo + '$1)')
      .replace(/href="#([^"]+)"/g, 'href="#' + prefijo + '$1"');
  }

  // ============================================================
  // ARRANQUE DE UNA PASTA
  // ============================================================
  function iniciarPasta(receta) {
    detenerTodo();
    // Crear/reanudar el audio dentro del toque (iOS bloquea el audio fuera de un gesto)
    if (!estado.silenciado) getAudioContext();
    estado.receta = receta;
    estado.pasoActual = 0;
    estado.errores = 0;
    estado.tiempoMs = 0;

    reactivarMesa();
    actualizarHud();
    pintarCrono(0);
    cargarComandaVisual(receta);
    actualizarPyrex(receta, 0);
    mostrarEstado('jugando');
    cuentaRegresiva(receta);
  }

  /* 3 · 2 · 1 · ¡YA! — el cronómetro y la mesa se habilitan en "¡YA!",
     así dos asociados que compiten arrancan en igualdad. */
  function cuentaRegresiva(receta) {
    const overlay = document.getElementById('cuenta-regresiva');
    const numero = document.getElementById('cuenta-numero');
    document.getElementById('cuenta-pasta').textContent = receta.nombre;
    overlay.classList.remove('oculto', 'cuenta-ya');

    const secuencia = ['3', '2', '1', '¡YA!'];
    secuencia.forEach(function(txt, i) {
      programar(function() {
        numero.textContent = txt;
        numero.classList.remove('cuenta-pop');
        void numero.offsetWidth; // reiniciar la animación
        numero.classList.add('cuenta-pop');

        if (txt === '¡YA!') {
          overlay.classList.add('cuenta-ya');
          sonidoSalida();
          arrancarCrono();
          programar(function() { overlay.classList.add('oculto'); }, 450);
        } else {
          sonidoCuenta();
        }
      }, i * 800);
    });
  }

  function programar(fn, ms) {
    estado.timeouts.push(setTimeout(fn, ms));
  }

  /* Corta cualquier partida en curso: cronómetro, cuenta regresiva y pausas. */
  function detenerTodo() {
    estado.enJuego = false;
    detenerCrono();
    estado.timeouts.forEach(clearTimeout);
    estado.timeouts = [];
    document.getElementById('cuenta-regresiva').classList.add('oculto');
    limpiarSeleccion();
  }

  // ============================================================
  // CRONÓMETRO (cuenta hacia arriba)
  // ============================================================
  function arrancarCrono() {
    estado.inicio = performance.now();
    estado.enJuego = true;
    const tick = function() {
      pintarCrono(performance.now() - estado.inicio);
      estado.rafId = requestAnimationFrame(tick);
    };
    estado.rafId = requestAnimationFrame(tick);
  }

  function detenerCrono() {
    if (estado.rafId) cancelAnimationFrame(estado.rafId);
    estado.rafId = null;
  }

  function pintarCrono(ms) {
    const txt = formatearCrono(ms);
    const valor = document.getElementById('crono-valor');
    if (valor.textContent !== txt) valor.textContent = txt;
    const enComanda = document.getElementById('svg-timer');
    if (enComanda && enComanda.textContent !== txt) enComanda.textContent = txt;
  }

  // ============================================================
  // COMANDA, PYREX Y HUD
  // ============================================================
  function cargarComandaVisual(receta) {
    let svg = GameHutSVG_MJ4.obtener('comanda-verde');
    if (!svg) return;

    const indice = RECETAS_MJ4.indexOf(receta);
    const colorHeader = '#1A3A1B';
    const orden = 'ORD #' + (5900 + indice + 1);
    const servicio = 'Práctica libre | ' + receta.pasos.length + ' ingredientes';

    // Mismo sistema del MJ4: textos inyectados DENTRO del SVG. La comanda
    // queda siempre en verde porque aquí no hay tiempo que se agote.
    const textosDinamicos =
      '<text x="35" y="42" font-family="Inter,Arial" font-size="14" font-weight="bold" fill="' + colorHeader + '">' + orden + '</text>' +
      '<text x="35" y="62" font-family="Inter,Arial" font-size="12" fill="' + colorHeader + '">' + escaparXml(servicio) + '</text>' +
      '<text x="35" y="125" font-family="Inter,Arial" font-size="15" font-weight="bold" fill="#FFFFFF">' + escaparXml(receta.nombre) + '</text>' +
      '<text id="svg-timer" x="160" y="200" font-family="JetBrains Mono,Inter,Arial" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">' + formatearCrono(0) + '</text>';

    svg = svg
      .replace('>ESPERA<', '>EN CURSO<')
      .replace('>Tiempo disponible<', '>Cronómetro<')
      .replace('</svg>', textosDinamicos + '</svg>');
    document.getElementById('comanda-display').innerHTML = svg;
  }

  function actualizarPyrex(receta, indicePaso) {
    const contenedor = document.getElementById('pyrex-display');
    if (indicePaso === 0) {
      GameHutSVG_MJ4.insertarEn(contenedor, 'pyrex');
    } else {
      const indiceVisual = Math.min(indicePaso - 1, receta.secuenciaVisual.length - 1);
      GameHutSVG_MJ4.insertarEn(contenedor, receta.secuenciaVisual[indiceVisual]);
    }
  }

  function actualizarHud() {
    const total = estado.receta ? estado.receta.pasos.length : 0;
    document.getElementById('progreso-paso').textContent = estado.pasoActual + ' / ' + total;
    document.getElementById('errores-hud').textContent = estado.errores;
  }

  // ============================================================
  // MESA DE TRABAJO (idéntica al MJ4)
  // ============================================================
  function construirMesaTrabajo() {
    const contenedor = document.getElementById('mesa-trabajo');
    contenedor.innerHTML = '';

    INGREDIENTES_MESA_MJ4.forEach(function(ing) {
      const inserto = document.createElement('div');
      inserto.className = 'inserto-mesa';
      inserto.dataset.ingredienteId = ing.id;
      inserto.dataset.categoria = ing.categoria;
      if (ing.distractor) inserto.classList.add('distractor');

      const svgWrap = document.createElement('div');
      svgWrap.className = 'inserto-svg';
      GameHutSVG_MJ4.insertarEn(svgWrap, ing.id);

      const label = document.createElement('div');
      label.className = 'inserto-label';
      label.textContent = ing.nombre;

      inserto.appendChild(svgWrap);
      inserto.appendChild(label);
      contenedor.appendChild(inserto);

      inserto.addEventListener('pointerdown', onInsertoPointerDown);
    });
  }

  function reactivarMesa() {
    document.querySelectorAll('.inserto-mesa.inserto-usado')
      .forEach(function(el) { el.classList.remove('inserto-usado'); });
    limpiarSeleccion();
  }

  // ============================================================
  // INTERACCIÓN: SOLO TAP-TO-PLACE (Pointer Events) — igual que el MJ4
  // Un toque casi quieto selecciona; si el dedo se desplaza fue scroll.
  // ============================================================
  let insertoSeleccionado = null;
  let candidatoInserto = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  const UMBRAL_TAP = 10; // px

  function onInsertoPointerDown(e) {
    if (!estado.enJuego) return;
    const inserto = e.currentTarget;
    if (inserto.classList.contains('inserto-usado')) return;
    if (e.button != null && e.button !== 0) return;

    candidatoInserto = inserto;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;

    document.addEventListener('pointerup', finalizarTap);
    document.addEventListener('pointercancel', cancelarTap);
  }

  function finalizarTap(e) {
    document.removeEventListener('pointerup', finalizarTap);
    document.removeEventListener('pointercancel', cancelarTap);

    const inserto = candidatoInserto;
    candidatoInserto = null;
    if (!inserto || !estado.enJuego) return;

    if (Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY) > UMBRAL_TAP) return;
    manejarTapInserto(inserto);
  }

  function cancelarTap() {
    document.removeEventListener('pointerup', finalizarTap);
    document.removeEventListener('pointercancel', cancelarTap);
    candidatoInserto = null;
  }

  function manejarTapInserto(inserto) {
    if (!inserto || inserto.classList.contains('inserto-usado')) return;
    if (insertoSeleccionado === inserto) {
      inserto.classList.remove('inserto-seleccionado');
      insertoSeleccionado = null;
    } else {
      if (insertoSeleccionado) insertoSeleccionado.classList.remove('inserto-seleccionado');
      insertoSeleccionado = inserto;
      inserto.classList.add('inserto-seleccionado');
    }
  }

  function manejarTapPyrex() {
    if (!estado.enJuego || !insertoSeleccionado) return;
    evaluarIngrediente(insertoSeleccionado.dataset.ingredienteId);
  }

  function limpiarSeleccion() {
    if (insertoSeleccionado) insertoSeleccionado.classList.remove('inserto-seleccionado');
    insertoSeleccionado = null;
    candidatoInserto = null;
  }

  function marcarIngredienteUsado(ingredienteId) {
    const inserto = document.querySelector('.inserto-mesa[data-ingrediente-id="' + ingredienteId + '"]');
    if (!inserto) return;
    inserto.classList.add('inserto-usado');
    if (insertoSeleccionado === inserto) limpiarSeleccion();
  }

  // ============================================================
  // EVALUACIÓN DEL INGREDIENTE COLOCADO
  // ============================================================
  function evaluarIngrediente(ingredienteId) {
    const receta = estado.receta;
    const esperado = receta.pasos[estado.pasoActual];

    if (ingredienteId === esperado) {
      sonidoAcierto();
      estado.pasoActual++;
      actualizarPyrex(receta, estado.pasoActual);
      mostrarFeedback('correcto');
      marcarIngredienteUsado(ingredienteId);
      actualizarHud();

      if (estado.pasoActual >= receta.pasos.length) terminarPasta();
    } else {
      // Sin penalización de tiempo: el error solo se cuenta.
      // La ficha queda seleccionada (igual que en el MJ4).
      sonidoError();
      estado.errores++;
      mostrarFeedback('error');
      actualizarHud();
    }
  }

  function mostrarFeedback(tipo) {
    const pyrex = document.getElementById('pyrex-display');
    pyrex.classList.remove('feedback-correcto', 'feedback-error');
    void pyrex.offsetWidth;
    pyrex.classList.add(tipo === 'correcto' ? 'feedback-correcto' : 'feedback-error');
    setTimeout(function() { pyrex.classList.remove('feedback-correcto', 'feedback-error'); }, 400);
  }

  // ============================================================
  // FIN DE LA PASTA → RESULTADO
  // ============================================================
  function terminarPasta() {
    // El tiempo se congela en el instante exacto del último ingrediente.
    estado.tiempoMs = performance.now() - estado.inicio;
    estado.enJuego = false;
    detenerCrono();
    pintarCrono(estado.tiempoMs);
    limpiarSeleccion();

    programar(mostrarResultado, PAUSA_FINAL_MS);
  }

  function mostrarResultado() {
    const receta = estado.receta;
    const ms = Math.round(estado.tiempoMs);
    const valido = Number.isFinite(ms) && ms > 0 && ms <= TIEMPO_MAXIMO_RAZONABLE_MS;

    const previo = recordDe(receta.id);
    const esNuevoRecord = valido && (!previo || ms < previo.ms);
    if (esNuevoRecord) {
      guardarRecord(receta.id, { ms: ms, errores: estado.errores, fecha: new Date().toISOString() });
    }

    document.getElementById('resultado-pasta').textContent = receta.nombre;
    document.getElementById('resultado-tiempo').textContent = valido ? formatearCrono(ms) : '—';
    document.getElementById('resultado-errores').textContent = estado.errores;
    document.getElementById('resultado-record').textContent = previo ? formatearCrono(previo.ms) : '—';

    const badge = document.getElementById('badge-nuevo-record');
    badge.classList.toggle('oculto', !esNuevoRecord);
    if (esNuevoRecord) sonidoFanfare();

    mostrarEstado('resultado');
  }

  function confirmarAbandono() {
    const enCurso = estado.enJuego || estado.timeouts.length > 0;
    if (enCurso && estado.pasoActual < (estado.receta ? estado.receta.pasos.length : 0)) {
      if (!confirm('¿Dejar esta pasta? El cronómetro se detiene y el tiempo no cuenta.')) return;
    }
    irAElegir();
  }

  // ============================================================
  // RÉCORDS POR PASTA (vía scores.js)
  // ============================================================
  function leerRecords() {
    try {
      const raw = (typeof getScore === 'function') ? getScore(ID_RECORDS) : null;
      if (raw && typeof raw === 'object' && raw.porPasta && typeof raw.porPasta === 'object') {
        return raw.porPasta;
      }
    } catch (e) { /* JSON corrupto o localStorage bloqueado: sin récords */ }
    return {};
  }

  function recordDe(idReceta) {
    const r = leerRecords()[idReceta];
    if (r && Number.isFinite(r.ms) && r.ms > 0 && r.ms <= TIEMPO_MAXIMO_RAZONABLE_MS) return r;
    return null;
  }

  function guardarRecord(idReceta, data) {
    const todos = leerRecords();
    todos[idReceta] = data;
    try {
      if (typeof saveScore === 'function') saveScore(ID_RECORDS, { porPasta: todos });
    } catch (e) { /* almacenamiento no disponible: el resultado se muestra igual */ }
  }

  function actualizarResumenRecords() {
    const conRecord = RECETAS_MJ4.filter(function(r) { return recordDe(r.id); }).length;
    document.getElementById('resumen-records').textContent = conRecord + ' / ' + RECETAS_MJ4.length;
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  /* m:ss.d — décimas para desempatar cuando compiten dos asociados */
  function formatearCrono(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const decimas = Math.floor(ms / 100);
    const m = Math.floor(decimas / 600);
    const s = Math.floor((decimas % 600) / 10);
    const d = decimas % 10;
    return m + ':' + (s < 10 ? '0' : '') + s + '.' + d;
  }

  function escaparXml(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ============================================================
  // SONIDOS (Web Audio API) — mismos tonos que el MJ4
  // ============================================================
  function getAudioContext() {
    if (!estado.audioContext) {
      try {
        estado.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    if (estado.audioContext.state === 'suspended') estado.audioContext.resume();
    return estado.audioContext;
  }

  function tocarTono(freqInicio, freqFin, duracion, tipo) {
    if (estado.silenciado) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.setValueAtTime(freqInicio, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freqFin, ctx.currentTime + duracion / 1000);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duracion / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duracion / 1000);
  }

  function sonidoAcierto() { tocarTono(800, 1200, 150, 'sine'); }
  function sonidoError()   { tocarTono(300, 200, 200, 'sawtooth'); }
  function sonidoCuenta()  { tocarTono(660, 660, 120, 'square'); }
  function sonidoSalida()  { tocarTono(990, 990, 260, 'square'); }
  function sonidoFanfare() {
    const notas = [523, 659, 784]; // Do-Mi-Sol
    notas.forEach(function(nota, i) {
      setTimeout(function() { tocarTono(nota, nota, 150, 'triangle'); }, i * 150);
    });
  }

  function leerPreferenciaMute() {
    try { return localStorage.getItem('gamehut-mute') === 'true'; } catch (e) { return false; }
  }

  function toggleSonido() {
    estado.silenciado = !estado.silenciado;
    try { localStorage.setItem('gamehut-mute', estado.silenciado); } catch (e) { /* sin persistencia */ }
    actualizarBotonSonido();
  }

  function actualizarBotonSonido() {
    document.querySelectorAll('.js-btn-sonido').forEach(function(btn) {
      btn.textContent = estado.silenciado ? '🔇' : '🔊';
    });
  }

})();
