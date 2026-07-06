/* ============================================================
   PROJECT GAMEHUT — Minijuego 3: "El corte correcto"
   Motor: minijuego-3.js
   ------------------------------------------------------------
   Depende de:  cortes.js (datos), cortes-svg.js (arte),
                scores.js (récord en localStorage)
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Estado del juego ---------- */
  let ronda = [];          // preguntas de la ronda actual
  let indice = 0;          // pregunta actual (0..n-1)
  let aciertos = 0;
  let rondaInicio = 0;     // timestamp de inicio (para el tiempo total)
  let respondido = false;  // evita doble respuesta en una pregunta
  let timerInterval = null;

  /* ---------- Referencias del DOM ---------- */
  let el = {};

  /* ---------- Utilidades ---------- */
  function mezclar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatTiempo(ms) {
    if (typeof ms !== "number" || !isFinite(ms)) return "\u2014";
    const s = ms / 1000;
    if (s < 60) return Math.round(s) + "s";
    const m = Math.floor(s / 60);
    const r = Math.round(s % 60);
    return m + ":" + String(r).padStart(2, "0");
  }

  function colorPorSegundos(s) {
    if (s < 60) return "verde";
    if (s <= 100) return "amarillo";
    return "rojo";
  }

  function colorPorFraccion(frac) {
    const sem = CONFIG_RONDA.semaforo;
    if (frac > sem.amarillo + sem.rojo) return "verde";  // > 50%
    if (frac > sem.rojo) return "amarillo";               // > 25%
    return "rojo";
  }

  const FEMENINOS = ["cebolla", "albahaca", "zanahoria"];
  function textoPregunta(entero, contexto) {
    const art = FEMENINOS.includes(entero.id) ? "la" : "el";
    return "¿Cómo se corta " + art + " " + entero.nombre.toLowerCase() + " " + contexto + "?";
  }

  /* ============================================================
     SONIDOS — Web Audio API (sin archivos externos)
     ============================================================ */
  const SonidoKey = "gh_sonido_silenciado";
  let audioCtx = null;
  // Defaultear a no-silenciado si nunca se configuró
  if (localStorage.getItem(SonidoKey) === null) {
    localStorage.setItem(SonidoKey, "false");
  }
  let silenciado = localStorage.getItem(SonidoKey) === "true";

  function ctx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    // Reanudar si el navegador lo suspendió (política de autoplay)
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tono(freqIni, freqFin, dur, tipo) {
    if (silenciado) return;
    const c = ctx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = tipo || "sine";
    const t = c.currentTime;
    osc.frequency.setValueAtTime(freqIni, t);
    if (freqFin !== freqIni) osc.frequency.linearRampToValueAtTime(freqFin, t + dur / 1000);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur / 1000);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + dur / 1000);
  }

  function sonidoAcierto() { tono(800, 1200, 150, "sine"); }
  function sonidoError()   { tono(300, 200, 200, "sawtooth"); }
  function sonidoTick()    { tono(900, 900, 40, "square"); }
  function sonidoFanfare() {
    if (silenciado) return;
    const notas = [523, 659, 784]; // Do - Mi - Sol
    notas.forEach((f, i) => setTimeout(() => tono(f, f, 160, "triangle"), i * 150));
  }

  function alternarSonido() {
    silenciado = !silenciado;
    localStorage.setItem(SonidoKey, silenciado ? "true" : "false");
    actualizarIconosSonido();
  }
  function actualizarIconosSonido() {
    const icono = silenciado ? "\uD83D\uDD07" : "\uD83D\uDD0A"; // 🔇 / 🔊
    if (el.btnSonido) el.btnSonido.innerHTML = icono;
    if (el.btnSonido2) el.btnSonido2.innerHTML = icono;
  }

  /* ============================================================
     ESTADOS
     ============================================================ */
  function mostrarEstado(n) {
    el.estado1.classList.toggle("oculto", n !== 1);
    el.estado2.classList.toggle("oculto", n !== 2);
    el.estado3.classList.toggle("oculto", n !== 3);
    if (n === 1) mostrarRecordEnPre();
  }

  function mostrarRecordEnPre() {
    el.recordActual.textContent = formatTiempo(obtenerRecordMs());
  }

  /* Devuelve el récord en ms (número finito) o null. Robusto ante
     cualquier forma que devuelva scores.js: null, número, objeto
     {tiempo}, o un string JSON. Así nunca llega NaN al formateo. */
  function obtenerRecordMs() {
    let v;
    try { v = getScore(CONFIG_RONDA.scoreId); }
    catch (e) { return null; }
    if (v == null) return null;
    if (typeof v === "string") {
      try { v = JSON.parse(v); } catch (e) { const n = parseFloat(v); return isFinite(n) ? n : null; }
    }
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v === "object" && v && isFinite(v.tiempo)) return v.tiempo * 1000;
    return null;
  }

  /* ============================================================
     RONDA
     ============================================================ */
  function generarRonda() {
    const porDif = { facil: [], medio: [], dificil: [] };
    PREGUNTAS.forEach(p => { if (porDif[p.dificultad]) porDif[p.dificultad].push(p); });

    let r = [];
    CONFIG_RONDA.ordenPorDificultad.forEach(dif => {
      const cuantas = CONFIG_RONDA.composicion[dif] || 0;
      const pool = mezclar(porDif[dif].slice());
      r = r.concat(pool.slice(0, cuantas));
    });
    return r; // ya en orden fácil -> medio -> difícil
  }

  /* Devuelve un arreglo de opciones { svg, correcto, key }:
     1) el corte correcto
     2) señuelos curados (near-miss reales, p.ej. cilantro/cebolla)
     3) señuelos del MISMO ingrediente (técnicas incorrectas, por código)
     4) relleno final con cortes reales al azar si faltara
     El motor decide acierto por la bandera .correcto, no por id. */
  function construirOpciones(pregunta) {
    const total = CONFIG_RONDA.opcionesPorPregunta[pregunta.dificultad] || 4;
    const ing = pregunta.ingredienteEntero;
    const correcto = CORTES[pregunta.corteCorrecto];
    const opciones = [{
      svg: GameHutSVG.obtener(correcto.svgId),
      correcto: true,
      key: pregunta.corteCorrecto
    }];
    const usados = new Set([correcto.tecnica]);

    // 2) señuelos curados (cortes reales; pueden ser de otro ingrediente)
    (pregunta.decoysSugeridos || []).forEach(d => {
      if (opciones.length < total && CORTES[d]) {
        opciones.push({ svg: GameHutSVG.obtener(CORTES[d].svgId), correcto: false, key: d });
        usados.add(CORTES[d].tecnica);
      }
    });

    // 3) señuelos del MISMO ingrediente (técnicas incorrectas, generadas)
    const tecnicas = mezclar((DECOYS_POR_INGREDIENTE[ing] || []).filter(t => !usados.has(t)));
    for (const t of tecnicas) {
      if (opciones.length >= total) break;
      const svg = GameHutSVG.decoy(ing, t);
      if (svg) { opciones.push({ svg: svg, correcto: false, key: ing + "_" + t }); usados.add(t); }
    }

    // 4) relleno final con cortes reales al azar (por si faltara)
    if (opciones.length < total) {
      const yaKeys = new Set(opciones.map(o => o.key));
      const resto = mezclar(Object.keys(CORTES).filter(id => !yaKeys.has(id) && id !== pregunta.corteCorrecto));
      while (opciones.length < total && resto.length) {
        const id = resto.pop();
        opciones.push({ svg: GameHutSVG.obtener(CORTES[id].svgId), correcto: false, key: id });
      }
    }

    return mezclar(opciones);
  }

  function iniciarRonda() {
    ronda = generarRonda();
    indice = 0;
    aciertos = 0;
    el.correctas.textContent = "0";
    rondaInicio = Date.now();
    mostrarEstado(2);
    mostrarPregunta();
  }

  /* ============================================================
     PREGUNTA
     ============================================================ */
  function mostrarPregunta() {
    respondido = false;
    const p = ronda[indice];
    const entero = ENTEROS[p.ingredienteEntero];

    el.progreso.textContent = (indice + 1) + " / " + ronda.length;
    el.enunciadoSvg.innerHTML = GameHutSVG.obtener(entero.svgId);
    el.preguntaTexto.textContent = textoPregunta(entero, p.contexto);

    // opciones
    el.opciones.innerHTML = "";
    construirOpciones(p).forEach(op => {
      const card = document.createElement("button");
      card.className = "opcion-card";
      card.type = "button";
      card.dataset.correcto = op.correcto ? "1" : "0";
      card.innerHTML = op.svg;
      card.addEventListener("click", () => elegir(card));
      el.opciones.appendChild(card);
    });

    el.feedback.textContent = "";
    el.feedback.className = "feedback";

    iniciarTimer(p);
  }

  /* ---------- Timer por pregunta (semáforo de comandas) ---------- */
  function iniciarTimer(p) {
    detenerTimer();
    const totalMs = (CONFIG_RONDA.tiempoPorPregunta[p.dificultad] || 10) * 1000;
    let restante = totalMs;
    let ultimoSeg = Math.ceil(restante / 1000);
    pintarTimer(restante, totalMs);

    timerInterval = setInterval(() => {
      restante -= 100;
      if (restante <= 0) {
        pintarTimer(0, totalMs);
        detenerTimer();
        tiempoAgotado(p);
        return;
      }
      const seg = Math.ceil(restante / 1000);
      const frac = restante / totalMs;
      if (frac <= CONFIG_RONDA.semaforo.rojo && seg !== ultimoSeg) sonidoTick();
      ultimoSeg = seg;
      pintarTimer(restante, totalMs);
    }, 100);
  }

  function pintarTimer(restante, totalMs) {
    const frac = totalMs > 0 ? restante / totalMs : 0;
    const color = colorPorFraccion(frac);
    el.timer.textContent = Math.ceil(restante / 1000);
    el.timer.className = "timer " + color;
    el.timerBarra.className = "timer-barra " + color;
    el.timerBarra.style.width = (frac * 100) + "%";
  }

  function detenerTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  /* ---------- Respuesta ---------- */
  function elegir(card) {
    if (respondido) return;
    respondido = true;
    detenerTimer();
    bloquearOpciones();

    if (card.dataset.correcto === "1") {
      card.classList.add("correcta");
      aciertos++;
      el.correctas.textContent = String(aciertos);
      el.feedback.textContent = "¡Correcto!";
      el.feedback.className = "feedback ok";
      sonidoAcierto();
      setTimeout(avanzar, 700);
    } else {
      card.classList.add("incorrecta");
      revelarCorrecta(card);
      el.feedback.textContent = "Incorrecto";
      el.feedback.className = "feedback mal";
      sonidoError();
      setTimeout(avanzar, 1500);
    }
  }

  function tiempoAgotado() {
    if (respondido) return;
    respondido = true;
    bloquearOpciones();
    revelarCorrecta(null);
    el.feedback.textContent = "¡Tiempo!";
    el.feedback.className = "feedback mal";
    sonidoError();
    setTimeout(avanzar, 1500);
  }

  function bloquearOpciones() {
    el.opciones.querySelectorAll(".opcion-card").forEach(c => c.classList.add("bloqueada"));
  }

  function revelarCorrecta(cardElegida) {
    el.opciones.querySelectorAll(".opcion-card").forEach(c => {
      if (c.dataset.correcto === "1") c.classList.add("correcta");
      else if (c !== cardElegida) c.classList.add("atenuada");
    });
  }

  /* ---------- Avanzar / terminar ---------- */
  function avanzar() {
    el.areaJuego.classList.add("salida");
    setTimeout(() => {
      indice++;
      if (indice >= ronda.length) {
        el.areaJuego.classList.remove("salida");
        terminarRonda();
        return;
      }
      el.areaJuego.classList.remove("salida");
      void el.areaJuego.offsetWidth; // reflow -> re-dispara el slideIn
      mostrarPregunta();
    }, 250);
  }

  /* ============================================================
     RESULTADO Y RÉCORD
     ============================================================ */
  function terminarRonda() {
    detenerTimer();
    const tiempoTotal = Date.now() - rondaInicio;
    const totalPreg = ronda.length;

    const recordAnterior = obtenerRecordMs(); // número finito o null
    const esValido = aciertos >= CONFIG_RONDA.minAciertosParaRecord;

    let nuevoRecord = false;
    let mejor = recordAnterior;

    if (esValido && (recordAnterior === null || tiempoTotal < recordAnterior)) {
      try { saveScore(CONFIG_RONDA.scoreId, { tiempo: Math.round(tiempoTotal / 1000) }); } catch (e) {}
      nuevoRecord = true;
      mejor = tiempoTotal;
    }

    // tiempo total coloreado con el mismo semáforo
    const segTotal = tiempoTotal / 1000;
    el.resultadoTiempo.textContent = formatTiempo(tiempoTotal);
    el.resultadoTiempo.className = "stat-valor " + colorPorSegundos(segTotal);

    el.resultadoAciertos.textContent = aciertos + " / " + totalPreg;
    el.resultadoRecordAnterior.textContent = formatTiempo(recordAnterior);
    el.resultadoMejor.textContent = formatTiempo(mejor);

    // mensaje contextual
    if (!esValido) {
      el.resultadoMensaje.textContent = "Necesitas al menos " +
        CONFIG_RONDA.minAciertosParaRecord + " aciertos para guardar récord. ¡Inténtalo de nuevo!";
    } else if (nuevoRecord) {
      el.resultadoMensaje.textContent = "¡Bajaste tu mejor tiempo!";
    } else {
      el.resultadoMensaje.textContent = "Buen trabajo revisando los cortes.";
    }

    el.badgeRecord.classList.toggle("oculto", !nuevoRecord);
    if (nuevoRecord) sonidoFanfare();

    mostrarEstado(3);
  }

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  function cachearDOM() {
    el = {
      estado1: document.getElementById("estado-1"),
      estado2: document.getElementById("estado-2"),
      estado3: document.getElementById("estado-3"),

      btnSonido: document.getElementById("btn-sonido"),
      btnSonido2: document.getElementById("btn-sonido-2"),
      btnComenzar: document.getElementById("btn-comenzar"),
      btnAbandonar: document.getElementById("btn-abandonar"),
      btnJugarOtra: document.getElementById("btn-jugar-otra"),

      recordActual: document.getElementById("record-actual"),

      progreso: document.getElementById("progreso"),
      timer: document.getElementById("timer"),
      timerBarra: document.getElementById("timer-barra"),
      correctas: document.getElementById("correctas"),

      areaJuego: document.getElementById("area-juego"),
      enunciadoSvg: document.getElementById("enunciado-svg"),
      preguntaTexto: document.getElementById("pregunta-texto"),
      opciones: document.getElementById("opciones"),
      feedback: document.getElementById("feedback"),

      badgeRecord: document.getElementById("badge-record"),
      resultadoTitulo: document.getElementById("resultado-titulo"),
      resultadoMensaje: document.getElementById("resultado-mensaje"),
      resultadoTiempo: document.getElementById("resultado-tiempo"),
      resultadoAciertos: document.getElementById("resultado-aciertos"),
      resultadoRecordAnterior: document.getElementById("resultado-record-anterior"),
      resultadoMejor: document.getElementById("resultado-mejor")
    };
  }

  function conectarEventos() {
    el.btnComenzar.addEventListener("click", () => { ctx(); iniciarRonda(); });
    el.btnJugarOtra.addEventListener("click", iniciarRonda);
    el.btnAbandonar.addEventListener("click", () => {
      detenerTimer();
      mostrarEstado(1);
    });
    if (el.btnSonido) el.btnSonido.addEventListener("click", alternarSonido);
    if (el.btnSonido2) el.btnSonido2.addEventListener("click", alternarSonido);
  }

  document.addEventListener("DOMContentLoaded", () => {
    GameHutSVG.inyectarDefs();
    cachearDOM();
    conectarEventos();
    actualizarIconosSonido();
    mostrarEstado(1);
  });

})();