/* ============================================================
   PROJECT GAMEHUT — Minijuego 4: El pedido llega
   Motor del juego
   Reutiliza: 3 estados, timer-semáforo, sonidos, scores.js,
              arquitectura document.elementFromPoint() de MJ2
   ============================================================ */

(function() {
  'use strict';

  // ============================================================
  // ESTADO DEL JUEGO
  // ============================================================
  const estado = {
    rondaActiva: false,
    silenciado: false,
    comandas: [],          // las 6 comandas seleccionadas para la ronda
    indiceComanda: 0,      // qué comanda estamos jugando
    pasoActual: 0,         // qué paso de la receta actual estamos esperando
    tiempoRestante: 0,     // segundos restantes para la comanda actual
    tiempoMaximo: 0,       // tiempo inicial de la comanda actual
    timerInterval: null,
    tickInterval: null,
    aciertos: 0,           // comandas completadas exitosamente
    fallos: 0,             // comandas fallidas (por tiempo)
    tiempoInicioRonda: 0,
    tiempoTotalRonda: 0,
    erroresEnComandaActual: 0,
    colorComandaActual: null,
    audioContext: null
  };

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  document.addEventListener('DOMContentLoaded', function() {
    inicializar();
  });

  function inicializar() {
    // Restaurar preferencia de sonido
    estado.silenciado = localStorage.getItem('gamehut-mute') === 'true';
    actualizarBotonSonido();

    // Mostrar récord en pantalla pre-juego
    mostrarRecord();

    // Listeners de botones
    document.getElementById('btn-comenzar').addEventListener('click', iniciarRonda);
    document.getElementById('btn-jugar-de-nuevo').addEventListener('click', iniciarRonda);
    document.getElementById('btn-abandonar').addEventListener('click', confirmarAbandono);
    document.getElementById('btn-sonido').addEventListener('click', toggleSonido);

    mostrarEstado('pre-juego');
  }

  // ============================================================
  // CONTROL DE ESTADOS DE PANTALLA
  // ============================================================
  function mostrarEstado(nombreEstado) {
    document.querySelectorAll('.estado-pantalla').forEach(el => el.classList.add('oculto'));
    document.getElementById('estado-' + nombreEstado).classList.remove('oculto');
  }

  // ============================================================
  // ARRANQUE DE RONDA
  // ============================================================
  function iniciarRonda() {
    // Seleccionar 6 comandas aleatorias de las 8 recetas
    estado.comandas = seleccionarComandasAleatorias(CONFIG_MJ4.comandasPorRonda);
    estado.indiceComanda = 0;
    estado.aciertos = 0;
    estado.fallos = 0;
    estado.tiempoInicioRonda = Date.now();
    estado.rondaActiva = true;

    construirMesaTrabajo();
    construirPyrexBase();
    mostrarEstado('jugando');
    cargarComandaActual();
  }

  function seleccionarComandasAleatorias(cantidad) {
    const baraja = [...RECETAS_MJ4];
    // Algoritmo Fisher-Yates
    for (let i = baraja.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
    }
    // Si pedimos más comandas que recetas, repetimos
    if (cantidad <= baraja.length) {
      return baraja.slice(0, cantidad);
    }
    const resultado = [...baraja];
    while (resultado.length < cantidad) {
      resultado.push(baraja[Math.floor(Math.random() * baraja.length)]);
    }
    return resultado;
  }

  // ============================================================
  // CARGA DE COMANDA ACTUAL
  // ============================================================
  function cargarComandaActual() {
    if (estado.indiceComanda >= estado.comandas.length) {
      finalizarRonda();
      return;
    }

    const comanda = estado.comandas[estado.indiceComanda];
    estado.pasoActual = 0;
    estado.erroresEnComandaActual = 0;
    estado.colorComandaActual = 'verde';

    // Calcular tiempo asignado: 7 segundos × número de ingredientes
    estado.tiempoMaximo = CONFIG_MJ4.segundosPorIngrediente * comanda.pasos.length;
    estado.tiempoRestante = estado.tiempoMaximo;

    // Actualizar HUD
    document.getElementById('progreso-ronda').textContent =
      (estado.indiceComanda + 1) + ' / ' + estado.comandas.length;
    document.getElementById('aciertos-hud').textContent = estado.aciertos;

    // Cargar comanda visual (verde al inicio)
    cargarComandaVisual('comanda-verde', comanda);

    // Mostrar el pyrex en estado vacío (paso 0)
    actualizarPyrex(comanda, 0);

    iniciarTimer();
  }

  function cargarComandaVisual(idColor, comanda) {
    const contenedor = document.getElementById('comanda-display');
    let svg = GameHutSVG_MJ4.obtener(idColor);
    if (!svg) return;

    // Color del texto del header según el estado (combina con la barra de color)
    let colorHeader = '#1A3A1B'; // verde oscuro por defecto
    if (idColor === 'comanda-amarillo') colorHeader = '#663D00';
    if (idColor === 'comanda-rojo') colorHeader = '#1A0F0F';

    // Texto dinámico que se inyecta DENTRO del SVG (mismo sistema de coordenadas
    // que el marco → alineación perfecta en cualquier tamaño de pantalla).
    const orden = 'ORD #' + (5800 + estado.indiceComanda + 1);
    const servicio = 'Comer en local | Mesa ' + (10 + estado.indiceComanda + 1);
    const platillo = comanda.nombre;
    const timerTxt = formatearTiempo(Math.ceil(estado.tiempoRestante));

    const textosDinamicos =
      '<text x="35" y="42" font-family="Inter,Arial" font-size="14" font-weight="bold" fill="' + colorHeader + '">' + orden + '</text>' +
      '<text x="35" y="62" font-family="Inter,Arial" font-size="12" fill="' + colorHeader + '">' + servicio + '</text>' +
      '<text x="35" y="125" font-family="Inter,Arial" font-size="15" font-weight="bold" fill="#FFFFFF">' + platillo + '</text>' +
      '<text id="svg-timer" x="160" y="200" font-family="Inter,Arial" font-size="26" font-weight="bold" fill="#FFFFFF" text-anchor="middle">' + timerTxt + '</text>';

    // Insertar los textos justo antes de </svg>
    svg = svg.replace('</svg>', textosDinamicos + '</svg>');
    contenedor.innerHTML = svg;
  }

  function actualizarPyrex(comanda, indicePaso) {
    const contenedor = document.getElementById('pyrex-display');
    if (indicePaso === 0) {
      // Pyrex vacío
      GameHutSVG_MJ4.insertarEn(contenedor, 'pyrex');
    } else {
      // Buscar el SVG de estado acumulado correspondiente
      // Las secuencias visuales están indexadas desde p1 → indicePaso 1
      const indiceVisual = Math.min(indicePaso - 1, comanda.secuenciaVisual.length - 1);
      const idVisual = comanda.secuenciaVisual[indiceVisual];
      GameHutSVG_MJ4.insertarEn(contenedor, idVisual);
    }
  }

  // ============================================================
  // CONSTRUCCIÓN DE LA MESA DE TRABAJO
  // ============================================================
  function construirMesaTrabajo() {
    const contenedor = document.getElementById('mesa-trabajo');
    contenedor.innerHTML = '';

    INGREDIENTES_MESA_MJ4.forEach(ing => {
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

      // Listeners de drag (pointer events para mouse + touch)
      inserto.addEventListener('pointerdown', iniciarArrastre);
    });
  }

  function construirPyrexBase() {
    const contenedor = document.getElementById('pyrex-display');
    GameHutSVG_MJ4.insertarEn(contenedor, 'pyrex');
  }

  // ============================================================
  // SISTEMA DE ARRASTRE (Pointer Events + elementFromPoint)
  // ============================================================
  let dragGhost = null;
  let dragIngredienteId = null;

  function iniciarArrastre(e) {
    if (!estado.rondaActiva) return;
    e.preventDefault();

    const inserto = e.currentTarget;
    dragIngredienteId = inserto.dataset.ingredienteId;

    // Crear "ghost" visual que sigue al puntero
    dragGhost = inserto.cloneNode(true);
    dragGhost.classList.add('drag-ghost');
    dragGhost.style.position = 'fixed';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '9999';
    dragGhost.style.opacity = '0.85';
    document.body.appendChild(dragGhost);

    moverGhost(e.clientX, e.clientY);

    document.addEventListener('pointermove', moverArrastre);
    document.addEventListener('pointerup', soltarArrastre);
    document.addEventListener('pointercancel', cancelarArrastre);
  }

  function moverArrastre(e) {
    if (dragGhost) moverGhost(e.clientX, e.clientY);
  }

  function moverGhost(x, y) {
    if (!dragGhost) return;
    dragGhost.style.left = (x - dragGhost.offsetWidth / 2) + 'px';
    dragGhost.style.top = (y - dragGhost.offsetHeight / 2) + 'px';
  }

  function soltarArrastre(e) {
    document.removeEventListener('pointermove', moverArrastre);
    document.removeEventListener('pointerup', soltarArrastre);
    document.removeEventListener('pointercancel', cancelarArrastre);

    // Detección de destino con elementFromPoint
    if (dragGhost) {
      dragGhost.style.display = 'none'; // Ocultar para que no interfiera
      const elementoDestino = document.elementFromPoint(e.clientX, e.clientY);
      dragGhost.remove();
      dragGhost = null;

      // Verificar si soltó sobre el pyrex
      const sobrePyrex = elementoDestino &&
        (elementoDestino.id === 'pyrex-display' ||
         elementoDestino.closest('#pyrex-display'));

      if (sobrePyrex) {
        evaluarIngrediente(dragIngredienteId);
      }
    }

    dragIngredienteId = null;
  }

  function cancelarArrastre() {
    document.removeEventListener('pointermove', moverArrastre);
    document.removeEventListener('pointerup', soltarArrastre);
    document.removeEventListener('pointercancel', cancelarArrastre);
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    dragIngredienteId = null;
  }

  // ============================================================
  // EVALUACIÓN DE INGREDIENTE SOLTADO
  // ============================================================
  function evaluarIngrediente(ingredienteId) {
    const comanda = estado.comandas[estado.indiceComanda];
    const ingredienteEsperado = comanda.pasos[estado.pasoActual];

    if (ingredienteId === ingredienteEsperado) {
      // ¡Acierto! Avanzar al siguiente paso
      sonidoAcierto();
      estado.pasoActual++;
      actualizarPyrex(comanda, estado.pasoActual);
      mostrarFeedback('correcto');

      // ¿Comanda completa?
      if (estado.pasoActual >= comanda.pasos.length) {
        completarComanda(true);
      }
    } else {
      // Error: penalización -2s y aviso visual/sonoro
      sonidoError();
      estado.tiempoRestante = Math.max(0, estado.tiempoRestante - CONFIG_MJ4.penalizacionError);
      estado.erroresEnComandaActual++;
      mostrarFeedback('error');
      actualizarTimerVisual();

      if (estado.tiempoRestante <= 0) {
        completarComanda(false);
      }
    }
  }

  function mostrarFeedback(tipo) {
    const pyrex = document.getElementById('pyrex-display');
    pyrex.classList.remove('feedback-correcto', 'feedback-error');
    void pyrex.offsetWidth; // forzar reflow
    pyrex.classList.add(tipo === 'correcto' ? 'feedback-correcto' : 'feedback-error');
    setTimeout(() => pyrex.classList.remove('feedback-correcto', 'feedback-error'), 400);
  }

  function completarComanda(exitosa) {
    detenerTimer();
    if (exitosa) {
      estado.aciertos++;
    } else {
      estado.fallos++;
    }
    estado.indiceComanda++;

    // Pequeña pausa antes de la próxima comanda
    setTimeout(cargarComandaActual, 800);
  }

  // ============================================================
  // TIMER CON SEMÁFORO
  // ============================================================
  function iniciarTimer() {
    detenerTimer();
    actualizarTimerVisual();

    estado.timerInterval = setInterval(() => {
      estado.tiempoRestante = Math.max(0, estado.tiempoRestante - 0.1);
      actualizarTimerVisual();

      if (estado.tiempoRestante <= 0) {
        completarComanda(false);
      }
    }, 100);
  }

  function detenerTimer() {
    if (estado.timerInterval) clearInterval(estado.timerInterval);
    if (estado.tickInterval) clearInterval(estado.tickInterval);
    estado.timerInterval = null;
    estado.tickInterval = null;
  }

  function actualizarTimerVisual() {
    const barra = document.getElementById('timer-barra');
    const label = document.getElementById('timer-segundos');
    const comandaTimer = document.getElementById('svg-timer');
    if (!barra || !label) return;

    const porcentaje = (estado.tiempoRestante / estado.tiempoMaximo) * 100;
    barra.style.width = Math.max(0, porcentaje) + '%';
    label.textContent = Math.ceil(estado.tiempoRestante) + 's';

    // Timer dentro de la comanda (elemento <text> del SVG) en formato mm:ss
    if (comandaTimer) {
      comandaTimer.textContent = formatearTiempo(Math.ceil(estado.tiempoRestante));
    }

    // Semáforo — solo recargar el SVG de la comanda cuando CAMBIA de color
    const proporcion = estado.tiempoRestante / estado.tiempoMaximo;
    let colorNuevo;
    if (proporcion <= CONFIG_MJ4.umbralRojo) {
      colorNuevo = 'rojo';
    } else if (proporcion <= CONFIG_MJ4.umbralAmarillo) {
      colorNuevo = 'amarillo';
    } else {
      colorNuevo = 'verde';
    }

    barra.classList.remove('verde', 'amarillo', 'rojo');
    barra.classList.add(colorNuevo);

    // Solo recargar el SVG de comanda si el color cambió (evita parpadeo)
    if (colorNuevo !== estado.colorComandaActual) {
      estado.colorComandaActual = colorNuevo;
      const comanda = estado.comandas[estado.indiceComanda];
      if (comanda) cargarComandaVisual('comanda-' + colorNuevo, comanda);

      if (colorNuevo === 'rojo') {
        if (!estado.tickInterval) iniciarTickRojo();
      } else {
        if (estado.tickInterval) { clearInterval(estado.tickInterval); estado.tickInterval = null; }
      }
    }
  }

  function iniciarTickRojo() {
    estado.tickInterval = setInterval(sonidoTick, 1000);
  }

  // ============================================================
  // FIN DE RONDA
  // ============================================================
  function finalizarRonda() {
    estado.rondaActiva = false;
    detenerTimer();

    // Cálculo del tiempo total de ronda con salvaguardas:
    let total = Math.floor((Date.now() - estado.tiempoInicioRonda) / 1000);
    // Si por alguna razón el inicio no se registró bien (total negativo o absurdo),
    // se descarta como inválido para no guardar récords corruptos.
    const TIEMPO_MAXIMO_RAZONABLE = 1800; // 30 minutos
    const totalValido = Number.isFinite(total) && total >= 0 && total <= TIEMPO_MAXIMO_RAZONABLE;
    estado.tiempoTotalRonda = totalValido ? total : 0;

    // Mostrar resultados
    document.getElementById('resultado-aciertos').textContent = estado.aciertos;
    document.getElementById('resultado-fallos').textContent = estado.fallos;
    document.getElementById('resultado-tiempo').textContent =
      totalValido ? formatearTiempo(estado.tiempoTotalRonda) : '—';

    // Récord — solo se guarda si el tiempo es válido Y se cumple el umbral de aciertos
    const recordValido = totalValido && estado.aciertos >= CONFIG_MJ4.umbralRecord;
    const recordPrevio = obtenerRecord();
    let esNuevoRecord = false;

    if (recordValido) {
      if (!recordPrevio || estado.tiempoTotalRonda < recordPrevio.tiempo) {
        guardarRecord({ tiempo: estado.tiempoTotalRonda, aciertos: estado.aciertos });
        esNuevoRecord = true;
      }
    }

    const badge = document.getElementById('badge-nuevo-record');
    if (esNuevoRecord) {
      badge.classList.remove('oculto');
      sonidoFanfare();
    } else {
      badge.classList.add('oculto');
    }

    const mensajeMinimo = document.getElementById('resultado-mensaje-minimo');
    if (mensajeMinimo) {
      const minimoAlcanzado = estado.aciertos >= CONFIG_MJ4.umbralRecord;
      mensajeMinimo.classList.toggle('oculto', minimoAlcanzado);
      mensajeMinimo.textContent = minimoAlcanzado
        ? ''
        : `Necesitas al menos ${CONFIG_MJ4.umbralRecord} de ${CONFIG_MJ4.comandasPorRonda} comandas para registrar récord. ¡Inténtalo de nuevo!`;
    }

    const recordLabel = document.getElementById('resultado-record');
    if (recordPrevio) {
      recordLabel.textContent = formatearTiempo(recordPrevio.tiempo);
    } else {
      recordLabel.textContent = '—';
    }

    mostrarEstado('resultado');
  }

  function confirmarAbandono() {
    if (confirm('¿Seguro que quieres abandonar la ronda?')) {
      estado.rondaActiva = false;
      detenerTimer();
      window.location.href = 'index.html';
    }
  }

  // ============================================================
  // SISTEMA DE RÉCORD (vía scores.js)
  // ============================================================
  function obtenerRecord() {
    let raw;
    if (typeof getScore === 'function') {
      raw = getScore('minijuego-4');
    } else {
      const stored = localStorage.getItem('gamehut-score-mj4');
      raw = stored ? JSON.parse(stored) : null;
    }
    // Normalizar y validar: el récord debe ser un objeto con tiempo numérico finito
    // y dentro de un rango razonable (descarta récords corruptos de pruebas viejas).
    const TIEMPO_MAXIMO_RAZONABLE = 1800; // 30 minutos
    if (!raw) return null;
    if (typeof raw === 'number') {
      return (Number.isFinite(raw) && raw >= 0 && raw <= TIEMPO_MAXIMO_RAZONABLE)
        ? { tiempo: raw, aciertos: 0 } : null;
    }
    if (typeof raw === 'object' && Number.isFinite(raw.tiempo)
        && raw.tiempo >= 0 && raw.tiempo <= TIEMPO_MAXIMO_RAZONABLE) {
      return raw;
    }
    return null; // formato o valor corrupto → tratar como sin récord
  }

  function guardarRecord(data) {
    if (typeof saveScore === 'function') {
      saveScore('minijuego-4', data);
    } else {
      localStorage.setItem('gamehut-score-mj4', JSON.stringify(data));
    }
  }

  function mostrarRecord() {
    const record = obtenerRecord();
    const elRecord = document.getElementById('record-actual');
    if (elRecord) {
      elRecord.textContent = record ? formatearTiempo(record.tiempo) : '—';
    }
  }

  function formatearTiempo(segundos) {
    if (!Number.isFinite(segundos)) return '—';
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ============================================================
  // SISTEMA DE SONIDOS (Web Audio API)
  // ============================================================
  function getAudioContext() {
    if (!estado.audioContext) {
      try {
        estado.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
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
  function sonidoTick()    { tocarTono(900, 900, 40, 'square'); }
  function sonidoFanfare() {
    const notas = [523, 659, 784]; // Do-Mi-Sol
    notas.forEach((nota, i) => setTimeout(() => tocarTono(nota, nota, 150, 'triangle'), i * 150));
  }

  function toggleSonido() {
    estado.silenciado = !estado.silenciado;
    localStorage.setItem('gamehut-mute', estado.silenciado);
    actualizarBotonSonido();
  }

  function actualizarBotonSonido() {
    const btn = document.getElementById('btn-sonido');
    if (btn) btn.textContent = estado.silenciado ? '🔇' : '🔊';
  }

})();