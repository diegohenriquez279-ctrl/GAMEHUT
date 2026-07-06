/* ============================================================
   GAMEHUT — LÓGICA DEL MINIJUEGO 1: ¿Qué hago ahora?
   Conecta: questions.js + scores.js + minijuego-1.html
   ============================================================ */


/* ============================================================
   1. CONFIGURACIÓN INICIAL Y ESTADO DEL JUEGO
   ============================================================ */

const ID_MINIJUEGO = "minijuego-1";
const PREGUNTAS_POR_RONDA = 8;

// Estado global del juego en curso
const estado = {
  preguntasRonda: [],        // las 8 preguntas seleccionadas para esta ronda
  indiceActual: 0,            // índice de la pregunta actual (0 a 7)
  correctas: 0,
  incorrectas: 0,
  tiempoInicioRonda: 0,       // timestamp para el timer invisible
  intervaloPregunta: null,    // referencia al setInterval del timer visible
  segundosRestantes: 0,
  respondida: false,          // bandera para evitar dobles clics
  sonidoActivo: true,         // controla si suenan los efectos
};

// Referencias a elementos del DOM (se asignan en init)
let dom = {};


/* ============================================================
   2. SISTEMA DE SONIDOS (Web Audio API)
   ============================================================ */

let audioCtx = null;

function inicializarAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    audioCtx = null;
  }
}

function reproducirTono(frecuenciaInicio, frecuenciaFin, duracionMs, tipoOnda = "sine", volumen = 0.15) {
  if (!estado.sonidoActivo || !audioCtx) return;

  const ahora = audioCtx.currentTime;
  const duracion = duracionMs / 1000;

  const oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();

  oscilador.type = tipoOnda;
  oscilador.frequency.setValueAtTime(frecuenciaInicio, ahora);
  oscilador.frequency.linearRampToValueAtTime(frecuenciaFin, ahora + duracion);

  // Envolvente: arranque suave y caída suave para evitar clicks
  ganancia.gain.setValueAtTime(0, ahora);
  ganancia.gain.linearRampToValueAtTime(volumen, ahora + 0.01);
  ganancia.gain.linearRampToValueAtTime(0, ahora + duracion);

  oscilador.connect(ganancia);
  ganancia.connect(audioCtx.destination);

  oscilador.start(ahora);
  oscilador.stop(ahora + duracion);
}

function sonidoAcierto() {
  // Tono ascendente agudo, agradable
  reproducirTono(800, 1200, 150, "sine", 0.18);
}

function sonidoError() {
  // Tono descendente grave
  reproducirTono(300, 200, 200, "sawtooth", 0.12);
}

function sonidoTick() {
  // Tick corto y seco
  reproducirTono(900, 900, 40, "square", 0.08);
}

function sonidoFanfare() {
  // Tres notas ascendentes para nuevo récord
  if (!estado.sonidoActivo || !audioCtx) return;
  setTimeout(() => reproducirTono(523, 523, 130, "sine", 0.15), 0);    // Do
  setTimeout(() => reproducirTono(659, 659, 130, "sine", 0.15), 140);  // Mi
  setTimeout(() => reproducirTono(784, 784, 250, "sine", 0.18), 280);  // Sol
}

function alternarSonido() {
  estado.sonidoActivo = !estado.sonidoActivo;
  localStorage.setItem("gamehut-sonido", estado.sonidoActivo ? "1" : "0");
  dom.iconoSonido.textContent = estado.sonidoActivo ? "🔊" : "🔇";
}

function cargarPreferenciaSonido() {
  const guardado = localStorage.getItem("gamehut-sonido");
  if (guardado === "0") {
    estado.sonidoActivo = false;
    dom.iconoSonido.textContent = "🔇";
  }
}


/* ============================================================
   3. SISTEMA DE RÉCORD
   ============================================================ */

function obtenerRecord() {
  // scores.js debe exponer getScore(id) → devuelve null si no existe
  if (typeof getScore !== "function") return null;
  return getScore(ID_MINIJUEGO);
}

function guardarRecord(tiempoSegundos) {
  if (typeof saveScore !== "function") return;
  saveScore(ID_MINIJUEGO, { tiempo: tiempoSegundos, fecha: new Date().toISOString() });
}

function mostrarRecordEnPantallaPre() {
  const record = obtenerRecord();
  if (record && typeof record.tiempo === "number") {
    dom.recordActual.textContent = formatearTiempo(record.tiempo);
    dom.recordActual.classList.remove("sin-record");
  } else {
    dom.recordActual.textContent = "--";
    dom.recordActual.classList.add("sin-record");
  }
}

function formatearTiempo(segundos) {
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}


/* ============================================================
   4. SELECCIÓN ROTATIVA DE PREGUNTAS
   ============================================================ */

function mezclar(array) {
  // Fisher-Yates shuffle
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function seleccionarPreguntasRonda() {
  // Estrategia: garantizar variedad de subtemas
  // Distribución objetivo en 8 preguntas:
  //   - 2 de seguridad-industrial
  //   - 2 de seguridad-alimentos
  //   - 2 de limpieza-diaria
  //   - 2 de lavado

  const porSubtema = {
    "seguridad-industrial": [],
    "seguridad-alimentos": [],
    "limpieza-diaria": [],
    "lavado": []
  };

  BANCO_PREGUNTAS_INTRODUCTORIOS.forEach(p => {
    if (porSubtema[p.subtema]) porSubtema[p.subtema].push(p);
  });

  const seleccionadas = [];
  Object.keys(porSubtema).forEach(subtema => {
    const mezcladas = mezclar(porSubtema[subtema]);
    seleccionadas.push(...mezcladas.slice(0, 2));
  });

  return mezclar(seleccionadas);  // mezclar el orden final
}

function mezclarOpcionesPregunta(pregunta) {
  // Crea una copia de la pregunta con las opciones en orden aleatorio
  // y recalcula cuál índice es ahora la correcta
  const indicesOriginales = pregunta.opciones.map((_, i) => i);
  const indicesMezclados = mezclar(indicesOriginales);

  const opcionesMezcladas = indicesMezclados.map(i => pregunta.opciones[i]);
  const nuevaCorrecta = indicesMezclados.indexOf(pregunta.correcta);

  return {
    ...pregunta,
    opciones: opcionesMezcladas,
    correcta: nuevaCorrecta
  };
}


/* ============================================================
   5. CONTROL DE ESTADOS (pantallas)
   ============================================================ */

function mostrarEstado(nombre) {
  dom.estadoPre.classList.add("oculto");
  dom.estadoJuego.classList.add("oculto");
  dom.estadoResultado.classList.add("oculto");

  if (nombre === "pre") dom.estadoPre.classList.remove("oculto");
  if (nombre === "juego") dom.estadoJuego.classList.remove("oculto");
  if (nombre === "resultado") dom.estadoResultado.classList.remove("oculto");
}


/* ============================================================
   6. TIMER POR PREGUNTA (visible con semáforo)
   ============================================================ */

function iniciarTimerPregunta(segundosTotales) {
  estado.segundosRestantes = segundosTotales;

  // Reset visual
  dom.timerBar.style.width = "100%";
  dom.timerBar.className = "mj-timer-bar verde";
  dom.timerSegundos.className = "mj-timer-segundos verde";
  dom.timerSegundos.textContent = `${segundosTotales}s`;

  // Tick cada 100ms para suavizar la barra
  const intervaloTick = 100;
  let msTranscurridos = 0;
  const msTotales = segundosTotales * 1000;

  // Umbrales del semáforo (50% verde, 25% amarillo, 25% rojo)
  const umbralAmarillo = msTotales * 0.5;
  const umbralRojo = msTotales * 0.75;

  let ultimoSegundoTick = -1; // para sonar el tick una vez por segundo en rojo

  estado.intervaloPregunta = setInterval(() => {
    msTranscurridos += intervaloTick;
    const msRestantes = msTotales - msTranscurridos;
    const porcentaje = Math.max(0, (msRestantes / msTotales) * 100);
    const segundosRestantes = Math.ceil(msRestantes / 1000);

    // Actualizar barra
    dom.timerBar.style.width = `${porcentaje}%`;
    dom.timerSegundos.textContent = `${Math.max(0, segundosRestantes)}s`;
    estado.segundosRestantes = segundosRestantes;

    // Cambios de color del semáforo
    let color = "verde";
    if (msTranscurridos >= umbralRojo) color = "rojo";
    else if (msTranscurridos >= umbralAmarillo) color = "amarillo";

    if (!dom.timerBar.classList.contains(color)) {
      dom.timerBar.className = `mj-timer-bar ${color}`;
      dom.timerSegundos.className = `mj-timer-segundos ${color}`;
    }

    // Tick sonoro cada segundo cuando está en rojo
    if (color === "rojo" && segundosRestantes > 0 && segundosRestantes !== ultimoSegundoTick) {
      sonidoTick();
      ultimoSegundoTick = segundosRestantes;
    }

    // Tiempo agotado
    if (msTranscurridos >= msTotales) {
      detenerTimerPregunta();
      manejarTiempoAgotado();
    }
  }, intervaloTick);
}

function detenerTimerPregunta() {
  if (estado.intervaloPregunta) {
    clearInterval(estado.intervaloPregunta);
    estado.intervaloPregunta = null;
  }
}


/* ============================================================
   7. TIMER DE RONDA (invisible)
   ============================================================ */

function iniciarTimerRonda() {
  estado.tiempoInicioRonda = Date.now();
}

function obtenerTiempoTotalRonda() {
  return Math.round((Date.now() - estado.tiempoInicioRonda) / 1000);
}


/* ============================================================
   8. FLUJO DE PREGUNTAS Y RESPUESTAS
   ============================================================ */

function mostrarPreguntaActual() {
  const pregunta = estado.preguntasRonda[estado.indiceActual];
  estado.respondida = false;

  // Actualizar progreso de ronda
  dom.progresoRonda.textContent = `Pregunta ${estado.indiceActual + 1} de ${PREGUNTAS_POR_RONDA}`;

  // Limpiar feedback anterior
  dom.feedback.textContent = "";
  dom.feedback.className = "mj-feedback";

  // Inyectar texto de la pregunta
  dom.preguntaTexto.textContent = pregunta.pregunta;

  // Generar botones de opciones
  dom.opcionesContainer.innerHTML = "";
  pregunta.opciones.forEach((textoOpcion, indice) => {
    const btn = document.createElement("button");
    btn.className = "mj-opcion";
    btn.textContent = textoOpcion;
    btn.dataset.indice = indice;
    btn.addEventListener("click", () => manejarRespuesta(indice));
    dom.opcionesContainer.appendChild(btn);
  });

  // Animación slide-in
  dom.estadoJuego.classList.remove("mj-slide-out");
  dom.estadoJuego.classList.add("mj-slide-in");
  setTimeout(() => dom.estadoJuego.classList.remove("mj-slide-in"), 400);

  // Iniciar timer con el tiempo de esta pregunta
  iniciarTimerPregunta(pregunta.tiempo);
}

function manejarRespuesta(indiceSeleccionado) {
  if (estado.respondida) return;
  estado.respondida = true;

  detenerTimerPregunta();

  const pregunta = estado.preguntasRonda[estado.indiceActual];
  const esCorrecta = indiceSeleccionado === pregunta.correcta;

  // Deshabilitar todos los botones
  const botones = dom.opcionesContainer.querySelectorAll(".mj-opcion");
  botones.forEach(b => b.disabled = true);

  if (esCorrecta) {
    estado.correctas++;
    botones[indiceSeleccionado].classList.add("correcta");
    mostrarFeedback("¡Correcto! ✓", "correcto");
    sonidoAcierto();
    setTimeout(avanzarPregunta, 600);
  } else {
    estado.incorrectas++;
    botones[indiceSeleccionado].classList.add("incorrecta");
    botones[pregunta.correcta].classList.add("correcta");  // revela la correcta
    mostrarFeedback("Incorrecto ✗", "incorrecto");
    sonidoError();
    setTimeout(avanzarPregunta, 1500);
  }
}

function manejarTiempoAgotado() {
  if (estado.respondida) return;
  estado.respondida = true;

  estado.incorrectas++;
  const pregunta = estado.preguntasRonda[estado.indiceActual];

  const botones = dom.opcionesContainer.querySelectorAll(".mj-opcion");
  botones.forEach(b => b.disabled = true);
  botones[pregunta.correcta].classList.add("correcta");  // revela la correcta

  mostrarFeedback("¡Tiempo!", "incorrecto");
  sonidoError();

  setTimeout(avanzarPregunta, 1500);
}

function mostrarFeedback(texto, tipo) {
  dom.feedback.textContent = texto;
  dom.feedback.className = `mj-feedback ${tipo} visible`;
}

function avanzarPregunta() {
  estado.indiceActual++;

  if (estado.indiceActual >= PREGUNTAS_POR_RONDA) {
    finalizarRonda();
    return;
  }

  // Animación slide-out de la pregunta saliente
  dom.estadoJuego.classList.add("mj-slide-out");
  setTimeout(() => {
    dom.estadoJuego.classList.remove("mj-slide-out");
    mostrarPreguntaActual();
  }, 400);
}


/* ============================================================
   9. PANTALLA DE RESULTADOS
   ============================================================ */

function finalizarRonda() {
  detenerTimerPregunta();
  const tiempoTotal = obtenerTiempoTotalRonda();

  // Determinar color del tiempo final según semáforo
  // Verde: < 60s | Amarillo: 60-100s | Rojo: > 100s
  let colorTiempo = "verde";
  if (tiempoTotal > 100) colorTiempo = "rojo";
  else if (tiempoTotal >= 60) colorTiempo = "amarillo";

  dom.tiempoTotal.textContent = formatearTiempo(tiempoTotal);
  dom.tiempoTotal.className = `mj-tiempo-total ${colorTiempo}`;

  // Estadísticas
  dom.statCorrectas.textContent = `${estado.correctas} / ${PREGUNTAS_POR_RONDA}`;
  dom.statIncorrectas.textContent = estado.incorrectas;

  // Manejo del récord
  // Solo se considera "ronda exitosa" si respondió al menos la mitad correctas
  const rondaValida = estado.correctas >= 7;
  const recordPrevio = obtenerRecord();
  const tiempoRecordPrevio = recordPrevio?.tiempo ?? null;

  let esNuevoRecord = false;
  if (rondaValida) {
    if (tiempoRecordPrevio === null || tiempoTotal < tiempoRecordPrevio) {
      esNuevoRecord = true;
      guardarRecord(tiempoTotal);
    }
  }

  // Mostrar récord anterior y nuevo récord
  if (tiempoRecordPrevio !== null) {
    dom.statRecordAnterior.textContent = formatearTiempo(tiempoRecordPrevio);
  } else {
    dom.statRecordAnterior.textContent = "--";
  }

  if (esNuevoRecord) {
    dom.statRecordNuevo.textContent = formatearTiempo(tiempoTotal);
    dom.badgeRecord.classList.remove("oculto");
    setTimeout(sonidoFanfare, 200);
  } else {
    dom.statRecordNuevo.textContent = tiempoRecordPrevio !== null
      ? formatearTiempo(tiempoRecordPrevio)
      : "--";
    dom.badgeRecord.classList.add("oculto");
  }

  if (dom.mensajeRecord) {
    dom.mensajeRecord.classList.toggle("oculto", rondaValida);
    dom.mensajeRecord.textContent = rondaValida
      ? ""
      : "Necesitas al menos 7 de 8 preguntas para registrar récord. ¡Inténtalo de nuevo!";
  }

  mostrarEstado("resultado");
}


/* ============================================================
   10. INICIO DE RONDA Y RESET
   ============================================================ */

function iniciarRonda() {
  // Web Audio API requiere interacción del usuario antes de sonar
  inicializarAudio();

  // Reset del estado
  estado.preguntasRonda = seleccionarPreguntasRonda().map(mezclarOpcionesPregunta);
  estado.indiceActual = 0;
  estado.correctas = 0;
  estado.incorrectas = 0;
  estado.respondida = false;

  iniciarTimerRonda();
  mostrarEstado("juego");
  mostrarPreguntaActual();
}

function volverAlMenuPre() {
  detenerTimerPregunta();
  mostrarRecordEnPantallaPre();
  mostrarEstado("pre");
}


/* ============================================================
   11. INICIALIZACIÓN
   ============================================================ */

function inicializar() {
  // Cachear referencias del DOM
  dom = {
    estadoPre: document.getElementById("estado-pre"),
    estadoJuego: document.getElementById("estado-juego"),
    estadoResultado: document.getElementById("estado-resultado"),

    recordActual: document.getElementById("record-actual"),
    btnComenzar: document.getElementById("btn-comenzar"),

    timerBar: document.getElementById("timer-bar"),
    timerSegundos: document.getElementById("timer-segundos"),
    progresoRonda: document.getElementById("progreso-ronda"),
    feedback: document.getElementById("feedback"),
    preguntaTexto: document.getElementById("pregunta-texto"),
    opcionesContainer: document.getElementById("opciones-container"),

    badgeRecord: document.getElementById("badge-record"),
    mensajeRecord: document.getElementById("mensaje-record"),
    tiempoTotal: document.getElementById("tiempo-total"),
    statCorrectas: document.getElementById("stat-correctas"),
    statIncorrectas: document.getElementById("stat-incorrectas"),
    statRecordAnterior: document.getElementById("stat-record-anterior"),
    statRecordNuevo: document.getElementById("stat-record-nuevo"),

    btnJugarNuevo: document.getElementById("btn-jugar-nuevo"),
    btnVolverMenu: document.getElementById("btn-volver-menu"),

    btnSonido: document.getElementById("btn-sonido"),
    iconoSonido: document.getElementById("icono-sonido"),
  };

  // Verificar dependencias
  if (typeof BANCO_PREGUNTAS_INTRODUCTORIOS === "undefined") {
    console.error("ERROR: questions.js no se cargó correctamente.");
    return;
  }

  // Cargar preferencia de sonido
  cargarPreferenciaSonido();

  // Mostrar récord en la pantalla inicial
  mostrarRecordEnPantallaPre();

  // Conectar botones
  dom.btnComenzar.addEventListener("click", iniciarRonda);
  dom.btnJugarNuevo.addEventListener("click", iniciarRonda);
  dom.btnVolverMenu.addEventListener("click", volverAlMenuPre);
  dom.btnSonido.addEventListener("click", () => {
    inicializarAudio();
    alternarSonido();
  });

  // Estado inicial
  mostrarEstado("pre");
}

// Esperar a que el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializar);
} else {
  inicializar();
}