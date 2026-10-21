/* ============================================================
   GAMEHUT — LÓGICA DEL MINIJUEGO 6: ¿Cuál sale primero?
   Conecta: escenarios-mj6.js + scores.js + minijuego-6.html
   ============================================================ */


/* ============================================================
   1. CONFIGURACIÓN INICIAL Y ESTADO DEL JUEGO
   ============================================================ */

const ID_MINIJUEGO = "minijuego-6";
const ESCENARIOS_POR_RONDA = 8;
const MINIMO_PARA_RECORD = 7;
const PAUSA_TRAS_ACIERTO_MS = 1400;   // luego avanza solo (o con "Siguiente")

const NOMBRES_SUBTEMA = {
  "peps": "PEPS",
  "etiquetado": "Etiquetado",
  "recepcion": "Recepción",
  "descarte": "Descarte y temperaturas"
};

// Estado global del juego en curso
const estado = {
  escenariosRonda: [],        // las 8 situaciones de esta ronda
  indiceActual: 0,
  correctas: 0,
  incorrectas: 0,
  falladas: [],               // { situacion, explicacion } para el repaso final
  hoy: null,                  // fecha de referencia de las etiquetas
  msRespuestaTotal: 0,        // suma de tiempos de respuesta (sin pausas de feedback)
  inicioEscenario: 0,
  intervaloEscenario: null,
  timeoutAvance: null,
  respondida: false,
  sonidoActivo: true,
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
  reproducirTono(800, 1200, 150, "sine", 0.18);
}

function sonidoError() {
  reproducirTono(300, 200, 200, "sawtooth", 0.12);
}

function sonidoTick() {
  reproducirTono(900, 900, 40, "square", 0.08);
}

function sonidoFanfare() {
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
   4. FECHAS DE LAS ETIQUETAS (relativas a hoy)
   ============================================================ */

function fechaRelativa(dias) {
  const h = estado.hoy;
  return new Date(h.getFullYear(), h.getMonth(), h.getDate() + dias);
}

function formatearFecha(fecha) {
  const d = fecha.getDate().toString().padStart(2, "0");
  const m = (fecha.getMonth() + 1).toString().padStart(2, "0");
  return `${d}/${m}`;
}


/* ============================================================
   5. SELECCIÓN ROTATIVA DE ESCENARIOS
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

function seleccionarEscenariosRonda() {
  // 2 situaciones de cada subtema → 8 por ronda
  const porSubtema = {};
  Object.keys(NOMBRES_SUBTEMA).forEach(s => { porSubtema[s] = []; });

  BANCO_ESCENARIOS_MJ6.forEach(e => {
    if (porSubtema[e.subtema]) porSubtema[e.subtema].push(e);
  });

  const seleccionados = [];
  Object.keys(porSubtema).forEach(subtema => {
    seleccionados.push(...mezclar(porSubtema[subtema]).slice(0, 2));
  });

  return mezclar(seleccionados);
}

function mezclarEscenario(escenario) {
  // En "elegir" se mezclan los recipientes; en "accion", las opciones.
  // En ambos casos se recalcula el índice correcto.
  const lista = escenario.tipo === "elegir" ? escenario.productos : escenario.opciones;
  const indices = mezclar(lista.map((_, i) => i));
  const mezclada = indices.map(i => lista[i]);
  const nuevaCorrecta = indices.indexOf(escenario.correcta);

  return escenario.tipo === "elegir"
    ? { ...escenario, productos: mezclada, correcta: nuevaCorrecta }
    : { ...escenario, opciones: mezclada, correcta: nuevaCorrecta };
}


/* ============================================================
   6. CONTROL DE ESTADOS (pantallas)
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
   7. TIMER POR ESCENARIO (visible con semáforo)
   ============================================================ */

function iniciarTimerEscenario(segundosTotales) {
  const msTotales = segundosTotales * 1000;
  estado.inicioEscenario = Date.now();

  dom.timerBar.style.width = "100%";
  dom.timerBar.className = "mj-timer-bar verde";
  dom.timerSegundos.className = "mj-timer-segundos verde";
  dom.timerSegundos.textContent = `${segundosTotales}s`;

  // Umbrales del semáforo (50% verde, 25% amarillo, 25% rojo)
  const umbralAmarillo = msTotales * 0.5;
  const umbralRojo = msTotales * 0.75;
  let ultimoSegundoTick = -1;

  estado.intervaloEscenario = setInterval(() => {
    const msTranscurridos = Date.now() - estado.inicioEscenario;
    const msRestantes = msTotales - msTranscurridos;
    const segundosRestantes = Math.max(0, Math.ceil(msRestantes / 1000));

    dom.timerBar.style.width = `${Math.max(0, (msRestantes / msTotales) * 100)}%`;
    dom.timerSegundos.textContent = `${segundosRestantes}s`;

    let color = "verde";
    if (msTranscurridos >= umbralRojo) color = "rojo";
    else if (msTranscurridos >= umbralAmarillo) color = "amarillo";

    if (!dom.timerBar.classList.contains(color)) {
      dom.timerBar.className = `mj-timer-bar ${color}`;
      dom.timerSegundos.className = `mj-timer-segundos ${color}`;
    }

    if (color === "rojo" && segundosRestantes > 0 && segundosRestantes !== ultimoSegundoTick) {
      sonidoTick();
      ultimoSegundoTick = segundosRestantes;
    }

    if (msTranscurridos >= msTotales) {
      manejarTiempoAgotado();
    }
  }, 100);
}

function detenerTimerEscenario() {
  if (estado.intervaloEscenario) {
    clearInterval(estado.intervaloEscenario);
    estado.intervaloEscenario = null;
  }
}

/* Suma al total el tiempo que tardó en responder (tope: el tiempo del escenario) */
function registrarTiempoRespuesta() {
  const escenario = estado.escenariosRonda[estado.indiceActual];
  const ms = Math.min(Date.now() - estado.inicioEscenario, escenario.tiempo * 1000);
  estado.msRespuestaTotal += ms;
}


/* ============================================================
   8. RENDER DE RECIPIENTES Y OPCIONES
   ============================================================ */

function crearEl(tag, clase, texto) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function crearFilaEtiqueta(rotulo, valor) {
  const fila = crearEl("span", "mj6-etiqueta__fila");
  fila.appendChild(crearEl("span", "mj6-etiqueta__rotulo", rotulo));
  fila.appendChild(crearEl("span", "mj6-etiqueta__valor", valor));
  return fila;
}

function crearEtiqueta(producto) {
  if (producto.sinEtiqueta) {
    return crearEl("span", "mj6-etiqueta mj6-etiqueta--sin", "SIN ETIQUETA");
  }

  const etiqueta = crearEl("span", "mj6-etiqueta");

  if (producto.ilegible) {
    etiqueta.classList.add("mj6-etiqueta--ilegible");
    etiqueta.appendChild(crearFilaEtiqueta("PREP", "??/??"));
    etiqueta.appendChild(crearFilaEtiqueta("VENCE", "??/??"));
    return etiqueta;
  }

  if (producto.etiqueta) {
    etiqueta.appendChild(crearEl("span", "mj6-etiqueta__libre", producto.etiqueta));
  }
  if (typeof producto.prep === "number") {
    etiqueta.appendChild(crearFilaEtiqueta("PREP", formatearFecha(fechaRelativa(producto.prep))));
  }
  if (typeof producto.vence === "number") {
    etiqueta.appendChild(crearFilaEtiqueta("VENCE", formatearFecha(fechaRelativa(producto.vence))));
  }
  if (producto.venceHora) {
    etiqueta.appendChild(crearFilaEtiqueta("HORA", producto.venceHora));
  }
  return etiqueta;
}

function crearRecipiente(producto, interactivo) {
  const envase = crearEl(interactivo ? "button" : "div", "mj6-envase");
  if (interactivo) envase.type = "button";
  else envase.classList.add("mj6-envase--fijo");

  if (producto.rol) envase.appendChild(crearEl("span", "mj6-envase__rol", producto.rol));

  envase.appendChild(crearEl("span", "mj6-envase__tapa"));

  const cuerpo = crearEl("span", "mj6-envase__cuerpo");
  cuerpo.appendChild(crearEl("span", "mj6-envase__emoji", producto.emoji || "📦"));
  cuerpo.appendChild(crearEl("span", "mj6-envase__nombre", producto.nombre));
  cuerpo.appendChild(crearEtiqueta(producto));
  if (producto.nota) cuerpo.appendChild(crearEl("span", "mj6-envase__nota", `⚠ ${producto.nota}`));
  if (producto.ubicacion) cuerpo.appendChild(crearEl("span", "mj6-envase__ubicacion", producto.ubicacion));
  envase.appendChild(cuerpo);

  return envase;
}

function renderEstante(escenario) {
  dom.estante.innerHTML = "";
  const productos = escenario.productos || [];
  dom.estante.classList.toggle("oculto", productos.length === 0);
  dom.estante.dataset.cantidad = productos.length;

  const interactivo = escenario.tipo === "elegir";
  productos.forEach((producto, indice) => {
    const envase = crearRecipiente(producto, interactivo);
    if (interactivo) envase.addEventListener("click", () => manejarRespuesta(indice));
    dom.estante.appendChild(envase);
  });
}

function renderOpciones(escenario) {
  dom.opcionesContainer.innerHTML = "";
  const esAccion = escenario.tipo === "accion";
  dom.opcionesContainer.classList.toggle("oculto", !esAccion);
  if (!esAccion) return;

  escenario.opciones.forEach((textoOpcion, indice) => {
    const btn = crearEl("button", "mj-opcion", textoOpcion);
    btn.type = "button";
    btn.addEventListener("click", () => manejarRespuesta(indice));
    dom.opcionesContainer.appendChild(btn);
  });
}

/* Botones de respuesta del escenario actual (recipientes u opciones) */
function botonesRespuesta() {
  const escenario = estado.escenariosRonda[estado.indiceActual];
  return escenario.tipo === "elegir"
    ? Array.from(dom.estante.querySelectorAll(".mj6-envase"))
    : Array.from(dom.opcionesContainer.querySelectorAll(".mj-opcion"));
}


/* ============================================================
   9. FLUJO DE ESCENARIOS Y RESPUESTAS
   ============================================================ */

function mostrarEscenarioActual() {
  const escenario = estado.escenariosRonda[estado.indiceActual];
  estado.respondida = false;

  dom.progresoRonda.textContent = `Situación ${estado.indiceActual + 1} de ${ESCENARIOS_POR_RONDA}`;
  dom.chipSubtema.textContent = NOMBRES_SUBTEMA[escenario.subtema] || "";
  dom.situacionTexto.textContent = escenario.situacion;
  dom.explicacion.classList.add("oculto");

  renderEstante(escenario);
  renderOpciones(escenario);

  dom.estadoJuego.classList.remove("mj-slide-out");
  dom.estadoJuego.classList.add("mj-slide-in");
  setTimeout(() => dom.estadoJuego.classList.remove("mj-slide-in"), 400);

  iniciarTimerEscenario(escenario.tiempo);
}

function manejarRespuesta(indiceSeleccionado) {
  if (estado.respondida) return;
  estado.respondida = true;

  detenerTimerEscenario();
  registrarTiempoRespuesta();

  const escenario = estado.escenariosRonda[estado.indiceActual];
  const esCorrecta = indiceSeleccionado === escenario.correcta;

  const botones = botonesRespuesta();
  botones.forEach(b => { b.disabled = true; });

  if (esCorrecta) {
    estado.correctas++;
    botones[indiceSeleccionado].classList.add("correcta");
    mostrarExplicacion("¡Correcto! ✓", "correcto", escenario.explicacion);
    sonidoAcierto();
    estado.timeoutAvance = setTimeout(avanzarEscenario, PAUSA_TRAS_ACIERTO_MS);
  } else {
    estado.incorrectas++;
    estado.falladas.push(escenario);
    botones[indiceSeleccionado].classList.add("incorrecta");
    botones[escenario.correcta].classList.add("correcta");  // revela la correcta
    mostrarExplicacion("Incorrecto ✗", "incorrecto", escenario.explicacion);
    sonidoError();
  }
}

function manejarTiempoAgotado() {
  if (estado.respondida) return;
  estado.respondida = true;

  detenerTimerEscenario();
  registrarTiempoRespuesta();

  const escenario = estado.escenariosRonda[estado.indiceActual];
  estado.incorrectas++;
  estado.falladas.push(escenario);

  const botones = botonesRespuesta();
  botones.forEach(b => { b.disabled = true; });
  botones[escenario.correcta].classList.add("correcta");  // revela la correcta

  mostrarExplicacion("¡Tiempo!", "incorrecto", escenario.explicacion);
  sonidoError();
}

function mostrarExplicacion(titulo, tipo, texto) {
  dom.explicacionTitulo.textContent = titulo;
  dom.explicacionTexto.textContent = texto;
  dom.explicacion.className = `mj6-explicacion ${tipo}`;
  dom.btnSiguiente.disabled = false;
  dom.btnSiguiente.textContent =
    estado.indiceActual + 1 >= ESCENARIOS_POR_RONDA ? "Ver resultados" : "Siguiente";

  // En pantallas chicas el panel puede quedar abajo del estante
  dom.explicacion.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function avanzarEscenario() {
  if (estado.timeoutAvance) {
    clearTimeout(estado.timeoutAvance);
    estado.timeoutAvance = null;
  }
  // Evita avanzar dos veces (clic en "Siguiente" justo cuando avanza solo)
  if (dom.btnSiguiente.disabled) return;
  dom.btnSiguiente.disabled = true;

  estado.indiceActual++;

  if (estado.indiceActual >= ESCENARIOS_POR_RONDA) {
    finalizarRonda();
    return;
  }

  dom.estadoJuego.classList.add("mj-slide-out");
  setTimeout(() => {
    dom.estadoJuego.classList.remove("mj-slide-out");
    window.scrollTo({ top: 0, behavior: "smooth" });
    mostrarEscenarioActual();
  }, 400);
}


/* ============================================================
   10. PANTALLA DE RESULTADOS
   ============================================================ */

function renderRepaso() {
  dom.repasoLista.innerHTML = "";
  dom.repaso.classList.toggle("oculto", estado.falladas.length === 0);

  estado.falladas.forEach(escenario => {
    const item = crearEl("li", "mj6-repaso__item");
    item.appendChild(crearEl("span", "mj6-repaso__situacion", escenario.situacion));
    item.appendChild(crearEl("span", "mj6-repaso__explicacion", escenario.explicacion));
    dom.repasoLista.appendChild(item);
  });
}

function finalizarRonda() {
  detenerTimerEscenario();
  const tiempoTotal = Math.round(estado.msRespuestaTotal / 1000);

  // Semáforo del tiempo final — Verde: < 60s | Amarillo: 60-100s | Rojo: > 100s
  let colorTiempo = "verde";
  if (tiempoTotal > 100) colorTiempo = "rojo";
  else if (tiempoTotal >= 60) colorTiempo = "amarillo";

  dom.tiempoTotal.textContent = formatearTiempo(tiempoTotal);
  dom.tiempoTotal.className = `mj-tiempo-total ${colorTiempo}`;

  dom.statCorrectas.textContent = `${estado.correctas} / ${ESCENARIOS_POR_RONDA}`;
  dom.statIncorrectas.textContent = estado.incorrectas;

  const rondaValida = estado.correctas >= MINIMO_PARA_RECORD;
  const recordPrevio = obtenerRecord();
  const tiempoRecordPrevio = recordPrevio?.tiempo ?? null;

  let esNuevoRecord = false;
  if (rondaValida && (tiempoRecordPrevio === null || tiempoTotal < tiempoRecordPrevio)) {
    esNuevoRecord = true;
    guardarRecord(tiempoTotal);
  }

  dom.statRecordAnterior.textContent = tiempoRecordPrevio !== null
    ? formatearTiempo(tiempoRecordPrevio)
    : "--";

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

  dom.mensajeRecord.classList.toggle("oculto", rondaValida);
  dom.mensajeRecord.textContent = rondaValida
    ? ""
    : `Necesitas al menos ${MINIMO_PARA_RECORD} de ${ESCENARIOS_POR_RONDA} situaciones para registrar récord. ¡Inténtalo de nuevo!`;

  renderRepaso();
  mostrarEstado("resultado");
  window.scrollTo({ top: 0 });
}


/* ============================================================
   11. INICIO DE RONDA Y RESET
   ============================================================ */

function iniciarRonda() {
  // Web Audio API requiere interacción del usuario antes de sonar
  inicializarAudio();

  estado.hoy = new Date();
  estado.escenariosRonda = seleccionarEscenariosRonda().map(mezclarEscenario);
  estado.indiceActual = 0;
  estado.correctas = 0;
  estado.incorrectas = 0;
  estado.falladas = [];
  estado.msRespuestaTotal = 0;
  estado.respondida = false;

  dom.chipHoy.textContent = `HOY ${formatearFecha(estado.hoy)}`;

  mostrarEstado("juego");
  mostrarEscenarioActual();
}

function volverAlMenuPre() {
  detenerTimerEscenario();
  mostrarRecordEnPantallaPre();
  mostrarEstado("pre");
}


/* ============================================================
   12. INICIALIZACIÓN
   ============================================================ */

function inicializar() {
  dom = {
    estadoPre: document.getElementById("estado-pre"),
    estadoJuego: document.getElementById("estado-juego"),
    estadoResultado: document.getElementById("estado-resultado"),

    recordActual: document.getElementById("record-actual"),
    btnComenzar: document.getElementById("btn-comenzar"),

    timerBar: document.getElementById("timer-bar"),
    timerSegundos: document.getElementById("timer-segundos"),
    progresoRonda: document.getElementById("progreso-ronda"),
    chipHoy: document.getElementById("chip-hoy"),
    chipSubtema: document.getElementById("chip-subtema"),
    situacionTexto: document.getElementById("situacion-texto"),
    estante: document.getElementById("estante"),
    opcionesContainer: document.getElementById("opciones-container"),
    explicacion: document.getElementById("explicacion"),
    explicacionTitulo: document.getElementById("explicacion-titulo"),
    explicacionTexto: document.getElementById("explicacion-texto"),
    btnSiguiente: document.getElementById("btn-siguiente"),

    badgeRecord: document.getElementById("badge-record"),
    mensajeRecord: document.getElementById("mensaje-record"),
    tiempoTotal: document.getElementById("tiempo-total"),
    statCorrectas: document.getElementById("stat-correctas"),
    statIncorrectas: document.getElementById("stat-incorrectas"),
    statRecordAnterior: document.getElementById("stat-record-anterior"),
    statRecordNuevo: document.getElementById("stat-record-nuevo"),
    repaso: document.getElementById("repaso"),
    repasoLista: document.getElementById("repaso-lista"),

    btnJugarNuevo: document.getElementById("btn-jugar-nuevo"),
    btnVolverMenu: document.getElementById("btn-volver-menu"),

    btnSonido: document.getElementById("btn-sonido"),
    iconoSonido: document.getElementById("icono-sonido"),
  };

  if (typeof BANCO_ESCENARIOS_MJ6 === "undefined") {
    console.error("ERROR: escenarios-mj6.js no se cargó correctamente.");
    return;
  }

  cargarPreferenciaSonido();
  mostrarRecordEnPantallaPre();

  dom.btnComenzar.addEventListener("click", iniciarRonda);
  dom.btnJugarNuevo.addEventListener("click", iniciarRonda);
  dom.btnVolverMenu.addEventListener("click", volverAlMenuPre);
  dom.btnSiguiente.addEventListener("click", avanzarEscenario);
  dom.btnSonido.addEventListener("click", () => {
    inicializarAudio();
    alternarSonido();
  });

  mostrarEstado("pre");
}

// Esperar a que el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializar);
} else {
  inicializar();
}
