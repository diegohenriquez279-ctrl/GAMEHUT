/* ============================================================
   GAMEHUT — LÓGICA DEL MINIJUEGO 7: Cortá la pizza
   Conecta: scores.js + minijuego-7.html

   Productos reales con su corte estándar: Súper Personal (4),
   Grande (8), Gigante (12), Cheesy Pops (10) y My Box (6).

   La pizza se dibuja en un <canvas>. Todo se calcula en
   coordenadas NORMALIZADAS: centro = (0, 0) y radio (medio ancho
   en la My Box) = 1, así el puntaje no depende de la pantalla.

   Cada corte es una recta  nx·x + ny·y = c  (n unitario y |c| =
   distancia al centro). Para medir las porciones se muestrea una
   grilla sobre la pizza: cada punto cae en la porción que define
   de qué lado queda respecto de cada corte.
   ============================================================ */


/* ============================================================
   1. CONFIGURACIÓN INICIAL Y ESTADO DEL JUEGO
   ============================================================ */

const ID_MINIJUEGO = "minijuego-7";

// Masas: solo cambian cómo se ve el borde
const MASAS = {
  "pan": { nombre: "Pan" },
  "hut-cheese": { nombre: "Hut Cheese" },
  "crispy": { nombre: "Crispy" },
};

// My Box: medio alto y radio de las esquinas (el medio ancho es 1)
const ALTO_RECTANGULAR = 0.62;
const RADIO_ESQUINA = 0.1;

/* Cortes de una pizza redonda: todos cruzan por el centro. Cada uno
   arranca en el ángulo indicado (grados de pantalla: 0 = derecha,
   90 = abajo, 180 = izquierda, 270 = arriba); ahí va su número en
   la guía. */
function referenciaRadial(inicios) {
  return inicios.map(grados => {
    const a = grados * Math.PI / 180;
    const desde = { x: Math.cos(a), y: Math.sin(a) };
    return { desde, hasta: { x: -desde.x, y: -desde.y } };
  });
}

/* Productos y su corte estándar.
   - referencia: los cortes en el orden de la guía.
   - grupos: cortes del mismo grupo se pueden hacer en cualquier orden
     entre sí (ej. las 2 diagonales de la Grande). null = sin orden.
   - radioEnTablero: tamaño en pantalla (radio o medio ancho / lado).
   - escala: tamaño de los ingredientes respecto de la pizza. */
const PRODUCTOS = {
  "super-personal": {
    nombre: "Súper Personal",
    forma: "redonda",
    borde: "masa",
    masas: ["pan", "hut-cheese", "crispy"],
    porciones: 4,
    referencia: referenciaRadial([270, 180]),
    grupos: [0, 1],
    radioEnTablero: 0.34,
    escala: 1.15,
    pista: "primero el vertical y después el horizontal",
    consejoOrden: "Orden de corte: primero el vertical y después el horizontal, formando la cruz.",
  },
  "grande": {
    nombre: "Grande",
    forma: "redonda",
    borde: "masa",
    masas: ["pan", "hut-cheese"],
    porciones: 8,
    referencia: referenciaRadial([270, 180, 135, 45]),
    grupos: [0, 1, 2, 2],
    radioEnTablero: 0.41,
    escala: 1,
    pista: "primero la cruz y después las 2 diagonales",
    consejoOrden: "Orden de corte: primero la cruz (vertical y horizontal), después las 2 diagonales.",
  },
  "gigante": {
    nombre: "Gigante",
    forma: "redonda",
    borde: "masa",
    masas: ["pan", "hut-cheese", "crispy"],
    porciones: 12,
    referencia: referenciaRadial([270, 180, 120, 150, 210, 240]),
    grupos: [0, 1, 2, 2, 3, 3],
    radioEnTablero: 0.46,
    escala: 0.85,
    pista: "primero la cruz y después cada cuarto en 3",
    consejoOrden: "Orden de corte: primero la cruz; después partí en 3 un par de cuartos opuestos (2 cortes) y luego el otro par (2 cortes).",
  },
  "cheesy-pops": {
    nombre: "Cheesy Pops",
    forma: "redonda",
    borde: "pops",
    masas: null,
    porciones: 10,
    referencia: referenciaRadial([180, 144, 108, 72, 36]),
    grupos: [0, 1, 2, 3, 4],
    radioEnTablero: 0.44,
    escala: 0.95,
    pista: "desde el horizontal, uno cada 36° hacia el mismo lado",
    consejoOrden: "Orden de corte: empezá con el horizontal y seguí girando hacia el mismo lado, un corte cada 36°.",
  },
  "my-box": {
    nombre: "My Box",
    forma: "rectangular",
    borde: "masa",
    masas: null,
    porciones: 6,
    // Rejilla de 3 × 2: verticales a los tercios, horizontal a la mitad
    referencia: [
      { desde: { x: -1 / 3, y: -ALTO_RECTANGULAR }, hasta: { x: -1 / 3, y: ALTO_RECTANGULAR } },
      { desde: { x: 1 / 3, y: -ALTO_RECTANGULAR }, hasta: { x: 1 / 3, y: ALTO_RECTANGULAR } },
      { desde: { x: -1, y: 0 }, hasta: { x: 1, y: 0 } },
    ],
    grupos: null,
    radioEnTablero: 0.44,
    escala: 1,
    pista: "2 verticales a los tercios y 1 horizontal a la mitad",
    consejoOrden: "En la My Box los cortes van paralelos a los lados: 2 verticales y 1 horizontal.",
  },
};

// Productos de cada pizza de la ronda (uno al azar si hay varios) y la
// ayuda, que se va retirando: guías → marcas (centro o bordes) → nada.
const PLAN_RONDA = [
  { productos: ["super-personal"], ayuda: "guias" },
  { productos: ["grande"], ayuda: "guias" },
  { productos: ["my-box"], ayuda: "marcas" },
  { productos: ["cheesy-pops"], ayuda: "guias" },
  { productos: ["gigante"], ayuda: "marcas" },
  { productos: ["super-personal", "grande", "gigante"], ayuda: "ninguna" },
];
const PIZZAS_POR_RONDA = PLAN_RONDA.length;

// Sabores del banco del MJ5 (solo cambia cómo se ve la pizza)
const SABORES = [
  { id: "pepperoni", nombre: "Pepperoni" },
  { id: "jamon", nombre: "Jamón" },
  { id: "suprema", nombre: "Suprema" },
  { id: "super-suprema", nombre: "Súper Suprema" },
];

const SEGUNDOS_BASE = 14;             // + SEGUNDOS_POR_CORTE por cada corte pedido
const SEGUNDOS_POR_CORTE = 2.5;
const RESOLUCION_MUESTREO = 160;      // puntos por unidad doble de la grilla de medición
const FRACCION_RECORTE = 0.25;        // pieza < 25% del ideal = recorte, no porción
const AREA_MIGAJA = 0.005;            // pieza < 0.5% de la pizza: ni porción ni recorte
const FACTOR_PRECISION = 2.5;         // cuánto castiga el desvío (calibrado en 8 porciones)
const UMBRAL_PERFECTA = 90;
const PENALIZACION_ORDEN = 10;        // puntos que resta cortar fuera de orden
const TOLERANCIA_ORDEN = 12;          // grados: más lejos es error de precisión, no de orden
const DESVIO_CENTRO_TOLERADO = 0.08;  // fracción del radio
const DESVIO_ANGULO_TOLERADO = 6;     // grados
const ARRASTRE_MINIMO_PX = 18;        // menos que esto es un toque, no un deslizamiento
const MARGEN_CORTE = 0.97;            // un corte que no entra a este margen no toca la pizza
const DURACION_ANIM_CORTE_MS = 180;
const PAUSA_ANTES_DE_EVALUAR_MS = 250;
const DURACION_AVISO_MS = 2200;

// Tinte de cada porción en el resultado según qué tan cerca quedó del ideal
const TINTE_PORCION = {
  verde: [76, 175, 80, 80],
  amarillo: [251, 192, 45, 115],
  rojo: [239, 83, 80, 130],
};

// Estado global del juego en curso
const estado = {
  pizzas: [],                 // las pizzas de la ronda
  indiceActual: 0,
  cortes: [],                 // cortes de la pizza actual { nx, ny, c, desde }
  piezas: null,               // porciones medidas al terminar la pizza
  resultados: [],             // { puntos, exacta, enOrden, porciones, pedidas, producto, imagen }
  terminada: false,
  trazo: null,                // deslizamiento en curso, en px del tablero
  ancla: null,                // primer punto del modo "dos toques"
  animCorte: null,
  inicioPizza: 0,
  intervaloPizza: null,
  timeoutEvaluar: null,
  timeoutAviso: null,
  sonidoActivo: true,
};

// Medidas del tablero en px CSS (se recalculan al redimensionar)
const tablero = {
  lado: 0,
  dpr: 1,
  centro: 0,
  radio: 0,                   // px de una unidad normalizada
  ctx: null,
  capaPizza: null,            // pizza pre-dibujada (no cambia mientras se corta)
  capaResultado: null,        // tinte de las porciones al terminar
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

/* Ruido filtrado corto: el "shhk" de la media luna pasando por la masa */
function sonidoCorte() {
  if (!estado.sonidoActivo || !audioCtx) return;

  const ahora = audioCtx.currentTime;
  const duracion = 0.14;
  const muestras = Math.floor(audioCtx.sampleRate * duracion);
  const buffer = audioCtx.createBuffer(1, muestras, audioCtx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;

  const ruido = audioCtx.createBufferSource();
  ruido.buffer = buffer;

  const filtro = audioCtx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.setValueAtTime(1800, ahora);
  filtro.frequency.linearRampToValueAtTime(3400, ahora + duracion);

  const ganancia = audioCtx.createGain();
  ganancia.gain.setValueAtTime(0, ahora);
  ganancia.gain.linearRampToValueAtTime(0.3, ahora + 0.01);
  ganancia.gain.linearRampToValueAtTime(0, ahora + duracion);

  ruido.connect(filtro);
  filtro.connect(ganancia);
  ganancia.connect(audioCtx.destination);

  ruido.start(ahora);
  ruido.stop(ahora + duracion);
}

function sonidoAcierto() {
  reproducirTono(800, 1200, 150, "sine", 0.18);
}

function sonidoNeutro() {
  reproducirTono(600, 600, 120, "sine", 0.12);
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
   3. SISTEMA DE RÉCORD (por puntos: más es mejor)
   ============================================================ */

function obtenerRecord() {
  if (typeof getScore !== "function") return null;
  return getScore(ID_MINIJUEGO);
}

function guardarRecord(puntos) {
  if (typeof saveScore !== "function") return;
  saveScore(ID_MINIJUEGO, { puntos: puntos, fecha: new Date().toISOString() });
}

function puntosDelRecord(record) {
  return record && typeof record.puntos === "number" ? record.puntos : null;
}

function mostrarRecordEnPantallaPre() {
  const puntos = puntosDelRecord(obtenerRecord());
  if (puntos !== null) {
    dom.recordActual.textContent = `${puntos} pts`;
    dom.recordActual.classList.remove("sin-record");
  } else {
    dom.recordActual.textContent = "--";
    dom.recordActual.classList.add("sin-record");
  }
}


/* ============================================================
   4. UTILIDADES
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

function alAzar(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function crearEl(tag, clase, texto) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function pizzaActual() {
  return estado.pizzas[estado.indiceActual] || null;
}

function cortesPedidos(pizza) {
  return pizza.producto.referencia.length;
}

function segundosPizza(pizza) {
  return Math.ceil(SEGUNDOS_BASE + cortesPedidos(pizza) * SEGUNDOS_POR_CORTE);
}

/* "Grande · Hut Cheese", "My Box"... */
function nombrePizza(pizza) {
  return pizza.masa ? `${pizza.producto.nombre} · ${MASAS[pizza.masa].nombre}` : pizza.producto.nombre;
}

function porcentaje(fraccion) {
  return `${(fraccion * 100).toFixed(1)}%`;
}

/* Semáforo de puntos (mismo para la pizza y el promedio final) */
function calificar(puntos) {
  if (puntos >= UMBRAL_PERFECTA) return { titulo: "¡Perfecta!", color: "verde" };
  if (puntos >= 75) return { titulo: "Bien cortada", color: "verde" };
  if (puntos >= 50) return { titulo: "Dispareja", color: "amarillo" };
  return { titulo: "Para repetir", color: "rojo" };
}


/* ============================================================
   5. ARMADO DE LAS PIZZAS (producto, masa, sabor e ingredientes)
   ============================================================ */

// Área de ingredientes de la Grande Pan: referencia para las cantidades
const AREA_INGREDIENTES_BASE = Math.PI * 0.74 * 0.74;

/* Zona donde van los ingredientes, según la forma y el borde */
function zonaIngredientes(producto, masa) {
  if (producto.forma === "rectangular") return { ancho: 0.84, alto: ALTO_RECTANGULAR - 0.15 };
  if (producto.borde === "pops") return { radio: 0.6 };
  if (masa === "crispy") return { radio: 0.8 };
  if (masa === "hut-cheese") return { radio: 0.7 };
  return { radio: 0.74 };
}

function areaZona(zona) {
  return zona.radio ? Math.PI * zona.radio * zona.radio : 4 * zona.ancho * zona.alto;
}

function puntoAlAzar(zona) {
  if (zona.radio) {
    // La raíz cuadrada evita que los puntos se amontonen en el centro
    const r = zona.radio * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  }
  return { x: (Math.random() * 2 - 1) * zona.ancho, y: (Math.random() * 2 - 1) * zona.alto };
}

/* Muestreo con rechazo: reparte sin que los ingredientes se encimen */
function repartirPuntos(cantidad, zona, separacion, ocupados) {
  const puntos = [];
  let intentos = 0;
  while (puntos.length < cantidad && intentos < cantidad * 80) {
    intentos++;
    const p = puntoAlAzar(zona);
    const libre = ocupados.every(o => Math.hypot(o.x - p.x, o.y - p.y) >= separacion);
    if (libre) {
      puntos.push(p);
      ocupados.push(p);
    }
  }
  return puntos;
}

/* Las cantidades base son para la Grande; se ajustan al área y a la
   escala de cada producto (más ingredientes en la Gigante, menos en
   la Súper Personal) */
function generarIngredientes(saborId, zona, escala) {
  const factor = areaZona(zona) / AREA_INGREDIENTES_BASE / (escala * escala);
  const ocupados = [];
  const ingredientes = [];
  const agregar = (tipo, cantidadBase, separacion) => {
    repartirPuntos(Math.round(cantidadBase * factor), zona, separacion * escala, ocupados).forEach(p => {
      ingredientes.push({ tipo, x: p.x, y: p.y, giro: Math.random() * Math.PI * 2, escala });
    });
  };

  if (saborId === "pepperoni") {
    agregar("pepperoni", 16, 0.2);
  } else if (saborId === "jamon") {
    agregar("jamon", 13, 0.22);
  } else if (saborId === "suprema") {
    agregar("pepperoni", 9, 0.2);
    agregar("carne", 14, 0.09);
    agregar("chile", 8, 0.1);
    agregar("cebolla", 6, 0.1);
  } else {
    agregar("pepperoni", 7, 0.2);
    agregar("jamon", 5, 0.2);
    agregar("carne", 10, 0.09);
    agregar("chile", 6, 0.1);
    agregar("aceituna", 8, 0.09);
  }
  return ingredientes;
}

/* Manchitas de queso gratinado (van debajo de los ingredientes) */
function generarGratinado(zona) {
  const cantidad = Math.round(26 * areaZona(zona) / AREA_INGREDIENTES_BASE);
  return Array.from({ length: cantidad }, () => {
    const p = puntoAlAzar(zona);
    return { x: p.x, y: p.y, r: 0.02 + Math.random() * 0.035, alfa: 0.25 + Math.random() * 0.35 };
  });
}

/* Bolitas de masa alrededor de la Cheesy Pops */
function generarPops() {
  const cantidad = 20;
  return Array.from({ length: cantidad }, (_, i) => {
    const a = (i / cantidad) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
    return { x: 0.87 * Math.cos(a), y: 0.87 * Math.sin(a), r: 0.125 + Math.random() * 0.012 };
  });
}

function armarPizzasRonda() {
  const sabores = mezclar(SABORES);
  return PLAN_RONDA.map((plan, i) => {
    const producto = PRODUCTOS[alAzar(plan.productos)];
    const masa = producto.masas ? alAzar(producto.masas) : null;
    const sabor = sabores[i % sabores.length];
    const zona = zonaIngredientes(producto, masa);
    return {
      producto,
      masa,
      sabor,
      ayuda: plan.ayuda,
      ingredientes: generarIngredientes(sabor.id, zona, producto.escala),
      gratinado: generarGratinado(zona),
      pops: producto.borde === "pops" ? generarPops() : null,
    };
  });
}


/* ============================================================
   6. GEOMETRÍA DE LOS CORTES Y MEDICIÓN DE PORCIONES
   ============================================================ */

function altoForma(producto) {
  return producto.forma === "rectangular" ? ALTO_RECTANGULAR : 1;
}

/* ¿El punto (normalizado) está sobre la pizza? */
function contiene(producto, x, y) {
  if (producto.forma === "redonda") return x * x + y * y <= 1;

  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax > 1 || ay > ALTO_RECTANGULAR) return false;
  const ex = ax - (1 - RADIO_ESQUINA);
  const ey = ay - (ALTO_RECTANGULAR - RADIO_ESQUINA);
  return ex <= 0 || ey <= 0 || ex * ex + ey * ey <= RADIO_ESQUINA * RADIO_ESQUINA;
}

/* Tramo de la recta que queda sobre la pizza (escalada por margen), o
   null si no la toca. En la My Box se recorta contra el rectángulo: las
   esquinas redondeadas no cambian nada a la vista. */
function tramoSobrePizza(corte, producto, margen = 1) {
  const pieX = corte.nx * corte.c;
  const pieY = corte.ny * corte.c;
  const dx = -corte.ny;
  const dy = corte.nx;
  let tMin = -Infinity;
  let tMax = Infinity;

  if (producto.forma === "redonda") {
    const mediaCuerda2 = margen * margen - corte.c * corte.c;
    if (mediaCuerda2 <= 0) return null;
    tMax = Math.sqrt(mediaCuerda2);
    tMin = -tMax;
  } else {
    // Liang–Barsky: recorta la recta contra cada par de lados
    const ejes = [[pieX, dx, margen], [pieY, dy, ALTO_RECTANGULAR * margen]];
    for (const [p, d, limite] of ejes) {
      if (Math.abs(d) < 1e-9) {
        if (Math.abs(p) > limite) return null;
        continue;
      }
      const t1 = (-limite - p) / d;
      const t2 = (limite - p) / d;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    }
    if (tMin >= tMax) return null;
  }

  return [
    { x: pieX + dx * tMin, y: pieY + dy * tMin },
    { x: pieX + dx * tMax, y: pieY + dy * tMax },
  ];
}

/* Recta que pasa por a y b (coords normalizadas). null si no toca la pizza. */
function corteDesdePuntos(a, b, producto) {
  const largo = Math.hypot(b.x - a.x, b.y - a.y);
  if (largo < 1e-6) return null;

  const dx = (b.x - a.x) / largo;
  const dy = (b.y - a.y) / largo;
  const corte = { nx: -dy, ny: dx, c: -dy * a.x + dx * a.y, desde: a };
  return tramoSobrePizza(corte, producto, MARGEN_CORTE) ? corte : null;
}

/* Extremos del corte sobre la pizza, empezando por el lado donde
   arrancó el gesto (así la animación sigue al dedo) */
function extremosCorte(corte, producto) {
  const tramo = tramoSobrePizza(corte, producto);
  if (!tramo) return null;
  const [a, b] = tramo;
  const dA = Math.hypot(a.x - corte.desde.x, a.y - corte.desde.y);
  const dB = Math.hypot(b.x - corte.desde.x, b.y - corte.desde.y);
  return dA <= dB ? [a, b] : [b, a];
}

/* Identifica la porción de un punto: un bit por corte según el lado */
function claveDePunto(x, y, cortes) {
  let clave = 0;
  for (let k = 0; k < cortes.length; k++) {
    if (cortes[k].nx * x + cortes[k].ny * y > cortes[k].c) clave |= 1 << k;
  }
  return clave;
}

/* Área (fracción de la pizza) y centro de cada porción, de mayor a menor */
function medirPorciones(cortes, producto) {
  const totalClaves = 1 << cortes.length;
  const cuenta = new Array(totalClaves).fill(0);
  const sumaX = new Array(totalClaves).fill(0);
  const sumaY = new Array(totalClaves).fill(0);
  const paso = 2 / RESOLUCION_MUESTREO;
  const alto = altoForma(producto);
  const filas = Math.round((2 * alto) / paso);
  let dentro = 0;

  for (let i = 0; i < filas; i++) {
    const y = -alto + paso * (i + 0.5);
    for (let j = 0; j < RESOLUCION_MUESTREO; j++) {
      const x = -1 + paso * (j + 0.5);
      if (!contiene(producto, x, y)) continue;
      const clave = claveDePunto(x, y, cortes);
      cuenta[clave]++;
      sumaX[clave] += x;
      sumaY[clave] += y;
      dentro++;
    }
  }

  const piezas = [];
  for (let clave = 0; clave < totalClaves; clave++) {
    if (!cuenta[clave]) continue;
    piezas.push({
      clave,
      area: cuenta[clave] / dentro,
      cx: sumaX[clave] / cuenta[clave],
      cy: sumaY[clave] / cuenta[clave],
    });
  }
  return piezas.sort((p, q) => q.area - p.area);
}

/* Ángulo de una dirección como recta (0–180°) y diferencia entre rectas */
function anguloLinea(dx, dy) {
  return ((Math.atan2(dy, dx) * 180 / Math.PI) % 180 + 180) % 180;
}

function difAngular(a, b) {
  const d = (((a - b) % 180) + 180) % 180;
  return Math.min(d, 180 - d);
}

/* Igual que difAngular pero con signo, en [-90, 90) */
function difConSigno(a, b) {
  return ((((a - b) % 180) + 270) % 180) - 90;
}

function anguloDeCorte(corte) {
  return anguloLinea(-corte.ny, corte.nx);
}

function anguloReferencia(ref) {
  return anguloLinea(ref.hasta.x - ref.desde.x, ref.hasta.y - ref.desde.y);
}

/* ¿El corte cae sobre esta línea de la guía? */
function corteCoincide(corte, ref) {
  const medioX = (ref.desde.x + ref.hasta.x) / 2;
  const medioY = (ref.desde.y + ref.hasta.y) / 2;
  return difAngular(anguloDeCorte(corte), anguloReferencia(ref)) < TOLERANCIA_ORDEN &&
         Math.abs(corte.nx * medioX + corte.ny * medioY - corte.c) < 0.12;
}

/* Desvío angular máximo respecto al reparto parejo (en grados) */
function desvioAngularMaximo(cortes) {
  const angulos = cortes.map(anguloDeCorte).sort((a, b) => a - b);
  const ideal = 180 / cortes.length;
  let peor = 0;
  angulos.forEach((angulo, i) => {
    const siguiente = i + 1 < angulos.length ? angulos[i + 1] : angulos[0] + 180;
    peor = Math.max(peor, Math.abs(siguiente - angulo - ideal));
  });
  return peor;
}

/* My Box: 2 cortes verticales y 1 horizontal, paralelos a los lados */
function rejillaCorrecta(cortes) {
  let verticales = 0;
  let horizontales = 0;
  for (const corte of cortes) {
    const angulo = anguloDeCorte(corte);
    if (difAngular(angulo, 90) <= TOLERANCIA_ORDEN) verticales++;
    else if (difAngular(angulo, 0) <= TOLERANCIA_ORDEN) horizontales++;
    else return false;
  }
  return verticales <= 2 && horizontales <= 1;
}

/* Pizzas redondas: la pizza puede estar girada en la mesa, así que se
   estima ese giro y se revisa que cada corte sea el que toca según la
   guía (o uno intercambiable con él). Se acepta también la guía en espejo. */
function cortesEnOrden(producto, cortes) {
  if (!producto.grupos) return rejillaCorrecta(cortes);
  if (cortes.length < 2) return true;

  const referencia = producto.referencia.map(anguloReferencia);
  const grupos = producto.grupos;

  return [1, -1].some(sentido => {
    const hechos = cortes.map(c => sentido * anguloDeCorte(c));

    // El giro sale del primer corte y se afina promediando los cortes que
    // caen cerca de su lugar, así un primer corte torcido no arrastra al resto
    let giro = hechos[0] - referencia[0];
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      const residuos = hechos.map((angulo, k) => referencia
        .filter((_, j) => grupos[j] === grupos[k])
        .map(ref => difConSigno(angulo - giro, ref))
        .reduce((mejor, d) => (Math.abs(d) < Math.abs(mejor) ? d : mejor)))
        .filter(d => Math.abs(d) <= 2 * TOLERANCIA_ORDEN);
      if (residuos.length) giro += residuos.reduce((suma, d) => suma + d, 0) / residuos.length;
    }

    return hechos.every((angulo, k) => {
      const cercaDe = j => difAngular(angulo - giro, referencia[j]) <= TOLERANCIA_ORDEN;
      // Es el corte que tocaba (o uno intercambiable con él)
      if (referencia.some((_, j) => grupos[j] === grupos[k] && cercaDe(j))) return true;
      // Fuera de orden solo si coincide claramente con otro corte de la guía;
      // si no se parece a ninguno es error de precisión
      return !referencia.some((_, j) => grupos[j] !== grupos[k] && cercaDe(j));
    });
  });
}

/* El desvío pesa más cuantas más porciones (cada error se reparte entre
   más bordes): se normaliza para que 4 y 12 porciones sean comparables */
function factorPrecision(porciones) {
  return FACTOR_PRECISION * Math.sqrt(8 / porciones);
}

/* Precisión 0–100: compara las piezas (de mayor a menor) con N porciones
   ideales de 1/N; las piezas que sobran se comparan contra 0. Cortar
   fuera de orden resta PENALIZACION_ORDEN. */
function evaluarPizza(pizza, cortes) {
  const producto = pizza.producto;
  const piezas = medirPorciones(cortes, producto);
  const ideal = 1 / producto.porciones;

  // Donde los cortes casi se cruzan en un punto quedan migajas: suman al
  // desvío (casi nada), pero no cuentan como recorte ni disparan consejos
  piezas.forEach(p => {
    const desvio = Math.abs(p.area - ideal) / ideal;
    p.esMigaja = p.area < AREA_MIGAJA;
    p.esRecorte = !p.esMigaja && p.area < ideal * FRACCION_RECORTE;
    p.calidad = p.esMigaja || p.esRecorte || desvio > 0.25 ? "rojo" : desvio > 0.1 ? "amarillo" : "verde";
  });

  const porciones = piezas.filter(p => !p.esMigaja && !p.esRecorte);
  const recortes = piezas.filter(p => p.esRecorte).length;
  const casillas = Math.max(piezas.length, producto.porciones);
  let desvioTotal = 0;
  for (let i = 0; i < casillas; i++) {
    const real = piezas[i] ? piezas[i].area : 0;
    const esperada = i < producto.porciones ? ideal : 0;
    desvioTotal += Math.abs(real - esperada);
  }
  const precision = Math.round(100 * Math.max(0, 1 - (desvioTotal / 2) * factorPrecision(producto.porciones)));
  const enOrden = cortesEnOrden(producto, cortes);

  return {
    piezas,
    precision,
    puntos: Math.max(0, precision - (enOrden ? 0 : PENALIZACION_ORDEN)),
    enOrden,
    porciones: porciones.length,
    recortes,
    exacta: porciones.length === producto.porciones,
    mayor: porciones.length ? porciones[0].area : 0,
    menor: porciones.length ? porciones[porciones.length - 1].area : 0,
  };
}

/* Consejo según el error más importante de la pizza */
function diagnosticar(pizza, cortes, evaluacion) {
  const producto = pizza.producto;
  const pedidos = cortesPedidos(pizza);
  if (cortes.length < pedidos) {
    const faltan = pedidos - cortes.length;
    const falta = faltan === 1 ? "Faltó 1 corte" : `Faltaron ${faltan} cortes`;
    return `${falta}. La pizza no espera: apuntá y cortá con decisión.`;
  }

  if (!evaluacion.enOrden) return producto.consejoOrden;

  if (evaluacion.precision >= UMBRAL_PERFECTA && evaluacion.recortes === 0) {
    return producto.forma === "rectangular"
      ? "Cortes derechos y bien ubicados. ¡Así se corta!"
      : "Cortes por el centro, en orden y bien repartidos. ¡Así se corta!";
  }

  if (producto.forma === "rectangular") {
    return "Ajustá la posición: los 2 verticales van a 1/3 y 2/3 del largo, y el horizontal justo a la mitad.";
  }

  // Se aconseja sobre el error que más pesó, relativo a su tolerancia
  const desvioCentro = Math.max(...cortes.map(c => Math.abs(c.c)));
  const desvioAngulo = desvioAngularMaximo(cortes);
  const pesoCentro = evaluacion.recortes > 0 ? Infinity : desvioCentro / DESVIO_CENTRO_TOLERADO;
  const pesoAngulo = desvioAngulo / DESVIO_ANGULO_TOLERADO;

  if (pesoCentro >= pesoAngulo) {
    return "Apuntá al centro: todos los cortes tienen que cruzarse en el mismo punto. Si no, quedan recortes y porciones de distinto tamaño.";
  }
  return `Repartí los cortes parejo: para ${producto.porciones} porciones va un corte cada ${180 / pedidos}°. ` +
         `Tu mayor desvío fue de ${Math.round(desvioAngulo)}°.`;
}


/* ============================================================
   7. TABLERO (canvas): MEDIDAS Y CONVERSIÓN DE COORDENADAS
   ============================================================ */

function ajustarTablero() {
  const lado = dom.tablero.clientWidth;
  if (!lado) return;   // la sección del juego está oculta

  const pizza = pizzaActual();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  tablero.lado = lado;
  tablero.dpr = dpr;
  tablero.centro = lado / 2;
  tablero.radio = lado * (pizza ? pizza.producto.radioEnTablero : 0.42);

  dom.tablero.width = Math.round(lado * dpr);
  dom.tablero.height = Math.round(lado * dpr);
  tablero.ctx = dom.tablero.getContext("2d");
  tablero.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Las capas pre-dibujadas dependen del tamaño: se rehacen
  if (pizza) prerenderPizza();
  if (estado.piezas) prerenderResultado();
  dibujar();
}

function aNormal(px, py) {
  return { x: (px - tablero.centro) / tablero.radio, y: (py - tablero.centro) / tablero.radio };
}

function aPx(x, y) {
  return { x: tablero.centro + x * tablero.radio, y: tablero.centro + y * tablero.radio };
}

function posicionEnTablero(ev) {
  const rect = dom.tablero.getBoundingClientRect();
  const escala = tablero.lado / dom.tablero.clientWidth;
  return {
    x: (ev.clientX - rect.left - dom.tablero.clientLeft) * escala,
    y: (ev.clientY - rect.top - dom.tablero.clientTop) * escala,
  };
}

function crearCapa() {
  const capa = document.createElement("canvas");
  capa.width = dom.tablero.width;
  capa.height = dom.tablero.height;
  const ctx = capa.getContext("2d");
  ctx.setTransform(tablero.dpr, 0, 0, tablero.dpr, 0, 0);
  return { capa, ctx };
}


/* ============================================================
   8. DIBUJO DE LA PIZZA
   ============================================================ */

// Borde de cada masa redonda: dónde empiezan la salsa y el queso
const BORDES_MASA = {
  "pan": { salsa: 0.885, queso: 0.865, colores: ["#E8B061", "#D49446", "#A9692A"] },
  "hut-cheese": { salsa: 0.83, queso: 0.81, colores: ["#F0C47A", "#DDA352", "#B57834"] },
  "crispy": { salsa: 0.955, queso: 0.94, colores: ["#E9C48A", "#D7A764", "#B9864A"] },
};

function circulo(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function linea(ctx, a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function rectRedondeado(ctx, x, y, ancho, alto, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, r);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, r);
  ctx.arcTo(x, y + alto, x, y, r);
  ctx.arcTo(x, y, x + ancho, y, r);
  ctx.closePath();
}

function sombraSobreLaMesa(ctx, radio) {
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = radio * 0.12;
  ctx.shadowOffsetY = radio * 0.05;
}

function rellenarQueso(ctx, radio) {
  const queso = ctx.createRadialGradient(-0.2, -0.25, 0.05, 0, 0, radio);
  queso.addColorStop(0, "#FFE7A3");
  queso.addColorStop(0.7, "#F7CF67");
  queso.addColorStop(1, "#EDB84A");
  ctx.fillStyle = queso;
}

/* Redonda con borde de masa: Pan (dorado y frito), Hut Cheese (borde
   ancho relleno de queso) o Crispy (borde fino) */
function dibujarBaseRedonda(ctx, masa, radioPx) {
  const borde = BORDES_MASA[masa];

  ctx.save();
  sombraSobreLaMesa(ctx, radioPx);
  const gradiente = ctx.createRadialGradient(0, 0, borde.salsa - 0.05, 0, 0, 1);
  gradiente.addColorStop(0, borde.colores[0]);
  gradiente.addColorStop(0.6, borde.colores[1]);
  gradiente.addColorStop(1, borde.colores[2]);
  ctx.fillStyle = gradiente;
  circulo(ctx, 0, 0, 1);
  ctx.fill();
  ctx.restore();

  if (masa === "pan") {
    ctx.strokeStyle = "rgba(120, 60, 20, 0.45)";
    ctx.lineWidth = 0.02;
    circulo(ctx, 0, 0, 0.99);
    ctx.stroke();
  } else if (masa === "hut-cheese") {
    // Costura del borde relleno, con el queso asomando
    ctx.strokeStyle = "rgba(255, 236, 168, 0.9)";
    ctx.lineWidth = 0.03;
    ctx.setLineDash([0.07, 0.045]);
    circulo(ctx, 0, 0, 0.915);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#B7381F";
  circulo(ctx, 0, 0, borde.salsa);
  ctx.fill();
  rellenarQueso(ctx, borde.queso);
  circulo(ctx, 0, 0, borde.queso);
  ctx.fill();
}

/* Cheesy Pops: anillo de bolitas de masa alrededor de una pizza más chica */
function dibujarBasePops(ctx, pizza, radioPx) {
  ctx.save();
  sombraSobreLaMesa(ctx, radioPx);
  pizza.pops.forEach(pop => {
    const masa = ctx.createRadialGradient(pop.x - pop.r * 0.3, pop.y - pop.r * 0.3, pop.r * 0.1, pop.x, pop.y, pop.r);
    masa.addColorStop(0, "#F6D08A");
    masa.addColorStop(0.65, "#DDA04F");
    masa.addColorStop(1, "#B9772F");
    ctx.fillStyle = masa;
    circulo(ctx, pop.x, pop.y, pop.r);
    ctx.fill();
  });
  ctx.restore();

  ctx.fillStyle = "#D49446";
  circulo(ctx, 0, 0, 0.77);
  ctx.fill();
  ctx.fillStyle = "#B7381F";
  circulo(ctx, 0, 0, 0.745);
  ctx.fill();
  rellenarQueso(ctx, 0.725);
  circulo(ctx, 0, 0, 0.725);
  ctx.fill();
}

/* My Box: pizza rectangular de molde, con los bordes más tostados */
function dibujarBaseRectangular(ctx, radioPx) {
  const alto = ALTO_RECTANGULAR;

  ctx.save();
  sombraSobreLaMesa(ctx, radioPx);
  const masa = ctx.createLinearGradient(0, -alto, 0, alto);
  masa.addColorStop(0, "#C9853B");
  masa.addColorStop(0.5, "#D9984A");
  masa.addColorStop(1, "#B06A2A");
  ctx.fillStyle = masa;
  rectRedondeado(ctx, -1, -alto, 2, alto * 2, RADIO_ESQUINA);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(110, 55, 18, 0.5)";
  ctx.lineWidth = 0.025;
  rectRedondeado(ctx, -0.99, -alto + 0.01, 1.98, alto * 2 - 0.02, RADIO_ESQUINA);
  ctx.stroke();

  ctx.fillStyle = "#B7381F";
  rectRedondeado(ctx, -0.92, -alto + 0.08, 1.84, (alto - 0.08) * 2, 0.06);
  ctx.fill();
  rellenarQueso(ctx, 1);
  rectRedondeado(ctx, -0.9, -alto + 0.1, 1.8, (alto - 0.1) * 2, 0.05);
  ctx.fill();
}

/* Dibuja en unidades de la pizza (radio 1) gracias a translate + scale */
function dibujarPizza(ctx, pizza, cx, cy, radio) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(radio, radio);

  if (pizza.producto.forma === "rectangular") dibujarBaseRectangular(ctx, radio);
  else if (pizza.producto.borde === "pops") dibujarBasePops(ctx, pizza, radio);
  else dibujarBaseRedonda(ctx, pizza.masa, radio);

  pizza.gratinado.forEach(m => {
    ctx.fillStyle = `rgba(214, 140, 48, ${m.alfa})`;
    circulo(ctx, m.x, m.y, m.r);
    ctx.fill();
  });

  pizza.ingredientes.forEach(ing => dibujarIngrediente(ctx, ing));
  ctx.restore();
}

function dibujarIngrediente(ctx, ing) {
  ctx.save();
  ctx.translate(ing.x, ing.y);
  ctx.rotate(ing.giro);
  ctx.scale(ing.escala, ing.escala);
  ctx.lineCap = "round";

  if (ing.tipo === "pepperoni") {
    ctx.fillStyle = "#9E241B";
    circulo(ctx, 0, 0, 0.1);
    ctx.fill();
    ctx.fillStyle = "#C2362A";
    circulo(ctx, -0.01, -0.012, 0.08);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 214, 170, 0.35)";
    [[0.03, 0.02], [-0.035, 0.028], [0.012, -0.04]].forEach(([x, y]) => {
      circulo(ctx, x, y, 0.011);
      ctx.fill();
    });
  } else if (ing.tipo === "jamon") {
    rectRedondeado(ctx, -0.075, -0.06, 0.15, 0.12, 0.025);
    ctx.fillStyle = "#EFA29B";
    ctx.fill();
    ctx.strokeStyle = "#D07A72";
    ctx.lineWidth = 0.012;
    ctx.stroke();
  } else if (ing.tipo === "carne") {
    ctx.fillStyle = "#6E3B22";
    [[0, 0, 0.03], [0.022, 0.01, 0.021], [-0.018, 0.016, 0.019]].forEach(([x, y, r]) => {
      circulo(ctx, x, y, r);
      ctx.fill();
    });
  } else if (ing.tipo === "chile") {
    ctx.strokeStyle = "#2F8A3B";
    ctx.lineWidth = 0.028;
    ctx.beginPath();
    ctx.arc(0, 0.06, 0.085, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  } else if (ing.tipo === "cebolla") {
    ctx.strokeStyle = "rgba(246, 239, 226, 0.95)";
    ctx.lineWidth = 0.018;
    ctx.beginPath();
    ctx.arc(0, 0.05, 0.075, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (ing.tipo === "aceituna") {
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 0.022;
    circulo(ctx, 0, 0, 0.034);
    ctx.stroke();
  }

  ctx.restore();
}

function prerenderPizza() {
  const { capa, ctx } = crearCapa();
  dibujarPizza(ctx, pizzaActual(), tablero.centro, tablero.centro, tablero.radio);
  tablero.capaPizza = capa;
}

/* Tinte por porción, píxel a píxel, a la resolución real del canvas */
function prerenderResultado() {
  const producto = pizzaActual().producto;
  const ancho = dom.tablero.width;
  const capa = document.createElement("canvas");
  capa.width = ancho;
  capa.height = ancho;
  const ctx = capa.getContext("2d");
  const imagen = ctx.createImageData(ancho, ancho);
  const datos = imagen.data;

  const tintePorClave = new Array(1 << estado.cortes.length).fill(null);
  estado.piezas.forEach(p => { tintePorClave[p.clave] = TINTE_PORCION[p.calidad]; });

  const centro = tablero.centro * tablero.dpr;
  const radio = tablero.radio * tablero.dpr;
  for (let fy = 0; fy < ancho; fy++) {
    const y = (fy + 0.5 - centro) / radio;
    if (Math.abs(y) > 1) continue;
    for (let fx = 0; fx < ancho; fx++) {
      const x = (fx + 0.5 - centro) / radio;
      if (!contiene(producto, x, y)) continue;
      // null: astilla tan fina que la grilla de medición no la alcanzó
      const tinte = tintePorClave[claveDePunto(x, y, estado.cortes)];
      if (!tinte) continue;
      const i = (fy * ancho + fx) * 4;
      datos[i] = tinte[0];
      datos[i + 1] = tinte[1];
      datos[i + 2] = tinte[2];
      datos[i + 3] = tinte[3];
    }
  }

  ctx.putImageData(imagen, 0, 0);
  tablero.capaResultado = capa;
}


/* ============================================================
   9. DIBUJO DEL TABLERO (ayuda, cortes, trazo y resultado)
   ============================================================ */

let dibujoPendiente = false;

/* Agrupa los redibujos del arrastre en uno por cuadro */
function pedirDibujo() {
  if (dibujoPendiente) return;
  dibujoPendiente = true;
  requestAnimationFrame(() => {
    dibujoPendiente = false;
    dibujar();
  });
}

function dibujar({ conEtiquetas = true } = {}) {
  const ctx = tablero.ctx;
  const pizza = pizzaActual();
  if (!ctx || !pizza) return;
  const lado = tablero.lado;

  ctx.clearRect(0, 0, lado, lado);
  if (tablero.capaPizza) ctx.drawImage(tablero.capaPizza, 0, 0, lado, lado);

  if (estado.terminada) {
    if (tablero.capaResultado) ctx.drawImage(tablero.capaResultado, 0, 0, lado, lado);
    dibujarCortes(ctx);
    if (conEtiquetas) dibujarEtiquetasPorciones(ctx);
    return;
  }

  dibujarAyuda(ctx, pizza);
  dibujarCortes(ctx);
  dibujarAncla(ctx);
  dibujarTrazo(ctx);
}

/* Trazo claro con centro oscuro: se lee sobre el queso y sobre la masa */
function trazoDoble(ctx, dibujo) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 3.5;
  dibujo();
  ctx.strokeStyle = "rgba(70, 32, 12, 0.85)";
  ctx.lineWidth = 1.5;
  dibujo();
}

function dibujarNumeroGuia(ctx, numero, punto) {
  ctx.fillStyle = "#D32F2F";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5;
  circulo(ctx, punto.x, punto.y, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 12px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(numero), punto.x, punto.y + 0.5);
}

function dibujarAyuda(ctx, pizza) {
  if (pizza.ayuda === "ninguna") return;
  const producto = pizza.producto;
  ctx.save();

  if (pizza.ayuda === "guias") {
    // Las líneas ya cortadas se ocultan; en las pizzas con orden se
    // resalta la que sigue y el resto queda tenue
    const pendientes = producto.referencia
      .map((ref, k) => ({ ref, numero: k + 1 }))
      .filter(({ ref }) => !estado.cortes.some(corte => corteCoincide(corte, ref)));
    const siguiente = producto.grupos && pendientes.length ? pendientes[0].numero : null;

    ctx.setLineDash([6, 7]);
    pendientes.forEach(({ ref, numero }) => {
      ctx.globalAlpha = siguiente === null || numero === siguiente ? 1 : 0.35;
      trazoDoble(ctx, () => linea(ctx, aPx(ref.desde.x, ref.desde.y), aPx(ref.hasta.x, ref.hasta.y)));
    });
    ctx.setLineDash([]);

    if (producto.grupos) {
      pendientes.forEach(({ ref, numero }) => {
        ctx.globalAlpha = numero === siguiente ? 1 : 0.55;
        dibujarNumeroGuia(ctx, numero, aPx(ref.desde.x, ref.desde.y));
      });
    }
    ctx.globalAlpha = 1;
  } else if (producto.forma === "rectangular") {
    // Marcas en los bordes: dónde entra y sale cada corte
    producto.referencia.forEach(ref => {
      const dx = ref.hasta.x - ref.desde.x;
      const dy = ref.hasta.y - ref.desde.y;
      const largo = Math.hypot(dx, dy);
      [ref.desde, ref.hasta].forEach((punto, i) => {
        const hacia = i === 0 ? 1 : -1;
        const afuera = { x: punto.x - (dx / largo) * 0.09 * hacia, y: punto.y - (dy / largo) * 0.09 * hacia };
        const adentro = { x: punto.x + (dx / largo) * 0.06 * hacia, y: punto.y + (dy / largo) * 0.06 * hacia };
        trazoDoble(ctx, () => linea(ctx, aPx(afuera.x, afuera.y), aPx(adentro.x, adentro.y)));
      });
    });
  }

  // Marca del centro (redondas)
  if (producto.forma === "redonda") {
    const c = aPx(0, 0);
    trazoDoble(ctx, () => {
      circulo(ctx, c.x, c.y, 5);
      ctx.stroke();
      linea(ctx, { x: c.x - 11, y: c.y }, { x: c.x + 11, y: c.y });
      linea(ctx, { x: c.x, y: c.y - 11 }, { x: c.x, y: c.y + 11 });
    });
  }

  ctx.restore();
}

function dibujarCortes(ctx) {
  const producto = pizzaActual().producto;
  ctx.save();
  ctx.lineCap = "round";

  estado.cortes.forEach((corte, i) => {
    const extremos = extremosCorte(corte, producto);
    if (!extremos) return;
    const [a, b] = extremos;
    let avance = 1;
    if (estado.animCorte && i === estado.cortes.length - 1) {
      avance = Math.min(1, (performance.now() - estado.animCorte.inicio) / DURACION_ANIM_CORTE_MS);
    }
    const desde = aPx(a.x, a.y);
    const hasta = aPx(a.x + (b.x - a.x) * avance, a.y + (b.y - a.y) * avance);

    // Ranura oscura con un brillo fino al medio
    ctx.strokeStyle = "rgba(48, 26, 12, 0.9)";
    ctx.lineWidth = 3.5;
    linea(ctx, desde, hasta);
    ctx.strokeStyle = "rgba(255, 236, 200, 0.3)";
    ctx.lineWidth = 1;
    linea(ctx, desde, hasta);
  });

  ctx.restore();
}

function dibujarTrazo(ctx) {
  const t = estado.trazo;
  if (!t || Math.hypot(t.x1 - t.x0, t.y1 - t.y0) < ARRASTRE_MINIMO_PX) return;

  const producto = pizzaActual().producto;
  const corte = corteDesdePuntos(aNormal(t.x0, t.y0), aNormal(t.x1, t.y1), producto);
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  if (corte) {
    const [a, b] = extremosCorte(corte, producto);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    linea(ctx, aPx(a.x, a.y), aPx(b.x, b.y));
  } else {
    // El corte no toca la pizza
    ctx.strokeStyle = "rgba(239, 83, 80, 0.85)";
    linea(ctx, { x: t.x0, y: t.y0 }, { x: t.x1, y: t.y1 });
  }
  ctx.setLineDash([]);

  // Punta de la media luna bajo el dedo
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillStyle = "rgba(211, 47, 47, 0.9)";
  ctx.lineWidth = 2;
  circulo(ctx, t.x1, t.y1, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function dibujarAncla(ctx) {
  const a = estado.ancla;
  if (!a) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillStyle = "rgba(211, 47, 47, 0.9)";
  ctx.lineWidth = 2;
  circulo(ctx, a.x, a.y, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function dibujarEtiquetasPorciones(ctx) {
  if (!estado.piezas) return;
  const porciones = pizzaActual().producto.porciones;
  const tamano = Math.max(10, Math.round(tablero.lado * (porciones > 8 ? 0.029 : 0.034)));

  ctx.save();
  ctx.font = `700 ${tamano}px 'JetBrains Mono', ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(17, 17, 17, 0.85)";
  ctx.fillStyle = "#FFFFFF";

  estado.piezas.forEach(p => {
    if (p.area < 0.02) return;   // astillas: sin rótulo
    const pos = aPx(p.cx, p.cy);
    const texto = porcentaje(p.area);
    ctx.strokeText(texto, pos.x, pos.y);
    ctx.fillText(texto, pos.x, pos.y);
  });

  ctx.restore();
}

function animarCorte() {
  if (!estado.animCorte) return;
  if (performance.now() - estado.animCorte.inicio >= DURACION_ANIM_CORTE_MS) {
    estado.animCorte = null;
    dibujar();
    return;
  }
  dibujar();
  requestAnimationFrame(animarCorte);
}

/* Miniatura recortada a la pizza (sin rótulos) para la galería final */
function capturarMiniatura() {
  dibujar({ conEtiquetas: false });

  const lado = 180;
  const mini = document.createElement("canvas");
  mini.width = lado;
  mini.height = lado;
  const ctx = mini.getContext("2d");
  ctx.fillStyle = "#221e1b";
  ctx.fillRect(0, 0, lado, lado);

  const margen = tablero.radio * 1.08;
  const origen = (tablero.centro - margen) * tablero.dpr;
  const tamano = margen * 2 * tablero.dpr;
  ctx.drawImage(dom.tablero, origen, origen, tamano, tamano, 0, 0, lado, lado);

  dibujar();
  return mini.toDataURL("image/jpeg", 0.85);
}


/* ============================================================
   10. GESTOS: DESLIZAR PARA CORTAR (o dos toques)
   ============================================================ */

function puedeCortar() {
  const pizza = pizzaActual();
  return !!pizza && !estado.terminada && estado.cortes.length < cortesPedidos(pizza);
}

function alPresionar(ev) {
  if (!puedeCortar() || estado.trazo) return;   // un solo dedo corta a la vez
  ev.preventDefault();
  // Captura: el corte sigue aunque el dedo salga del tablero
  try { dom.tablero.setPointerCapture(ev.pointerId); } catch (e) { /* puntero ya liberado */ }
  const p = posicionEnTablero(ev);
  estado.trazo = { id: ev.pointerId, x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  pedirDibujo();
}

function alMover(ev) {
  const t = estado.trazo;
  if (!t || ev.pointerId !== t.id) return;
  const p = posicionEnTablero(ev);
  t.x1 = p.x;
  t.y1 = p.y;
  pedirDibujo();
}

function alSoltar(ev) {
  const t = estado.trazo;
  if (!t || ev.pointerId !== t.id) return;
  estado.trazo = null;
  if (!puedeCortar()) {
    pedirDibujo();
    return;
  }

  const fin = { x: t.x1, y: t.y1 };
  if (Math.hypot(fin.x - t.x0, fin.y - t.y0) >= ARRASTRE_MINIMO_PX) {
    estado.ancla = null;
    intentarCorte({ x: t.x0, y: t.y0 }, fin);
  } else if (estado.ancla && Math.hypot(fin.x - estado.ancla.x, fin.y - estado.ancla.y) >= ARRASTRE_MINIMO_PX) {
    // Segundo toque: corta en línea recta entre los dos puntos
    const ancla = estado.ancla;
    estado.ancla = null;
    intentarCorte(ancla, fin);
  } else {
    estado.ancla = fin;
    mostrarAviso("Tocá otro punto para cortar en línea recta");
  }
  pedirDibujo();
}

function alCancelar(ev) {
  if (estado.trazo && ev.pointerId === estado.trazo.id) {
    estado.trazo = null;
    pedirDibujo();
  }
}

function intentarCorte(desdePx, hastaPx) {
  const pizza = pizzaActual();
  const corte = corteDesdePuntos(aNormal(desdePx.x, desdePx.y), aNormal(hastaPx.x, hastaPx.y), pizza.producto);
  if (!corte) {
    mostrarAviso("Ese corte no tocó la pizza");
    sonidoError();
    return;
  }

  limpiarAviso();
  estado.cortes.push(corte);
  estado.animCorte = { inicio: performance.now() };
  sonidoCorte();
  actualizarPips();
  requestAnimationFrame(animarCorte);

  if (estado.cortes.length >= cortesPedidos(pizza)) {
    // Último corte: el reloj se detiene ya y se evalúa al terminar la animación
    detenerTimerPizza();
    dom.tablero.classList.add("bloqueado");
    estado.timeoutEvaluar = setTimeout(() => terminarPizza(false),
      DURACION_ANIM_CORTE_MS + PAUSA_ANTES_DE_EVALUAR_MS);
  }
}

function mostrarAviso(texto) {
  clearTimeout(estado.timeoutAviso);
  dom.aviso.textContent = texto;
  estado.timeoutAviso = setTimeout(limpiarAviso, DURACION_AVISO_MS);
}

function limpiarAviso() {
  clearTimeout(estado.timeoutAviso);
  dom.aviso.textContent = "";
}

function renderPips(cantidad) {
  dom.pipsCortes.innerHTML = "";
  for (let i = 0; i < cantidad; i++) dom.pipsCortes.appendChild(crearEl("span", "mj7-pip"));
}

function actualizarPips() {
  Array.from(dom.pipsCortes.children).forEach((pip, i) => {
    pip.classList.toggle("hecho", i < estado.cortes.length);
  });
}


/* ============================================================
   11. CONTROL DE ESTADOS (pantallas)
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
   12. TIMER POR PIZZA (visible con semáforo)
   ============================================================ */

function iniciarTimerPizza(segundosTotales) {
  const msTotales = segundosTotales * 1000;
  estado.inicioPizza = Date.now();

  dom.timerBar.style.width = "100%";
  dom.timerBar.className = "mj-timer-bar verde";
  dom.timerSegundos.className = "mj-timer-segundos verde";
  dom.timerSegundos.textContent = `${segundosTotales}s`;

  // Umbrales del semáforo (50% verde, 25% amarillo, 25% rojo)
  const umbralAmarillo = msTotales * 0.5;
  const umbralRojo = msTotales * 0.75;
  let ultimoSegundoTick = -1;

  estado.intervaloPizza = setInterval(() => {
    const msTranscurridos = Date.now() - estado.inicioPizza;
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
      terminarPizza(true);
    }
  }, 100);
}

function detenerTimerPizza() {
  if (estado.intervaloPizza) {
    clearInterval(estado.intervaloPizza);
    estado.intervaloPizza = null;
  }
}


/* ============================================================
   13. FLUJO DE PIZZAS
   ============================================================ */

function textoInstruccion(pizza) {
  const pedidos = cortesPedidos(pizza);
  const producto = pizza.producto;
  if (pizza.ayuda === "guias") {
    return producto.grupos
      ? `Seguí las guías en orden: ${pedidos} cortes`
      : `Seguí las guías: ${pedidos} cortes`;
  }
  if (pizza.ayuda === "marcas") return `${pedidos} cortes: ${producto.pista}`;
  return `Sin ayuda: ${pedidos} cortes`;
}

function mostrarPizzaActual() {
  const pizza = pizzaActual();

  estado.cortes = [];
  estado.piezas = null;
  estado.terminada = false;
  estado.trazo = null;
  estado.ancla = null;
  estado.animCorte = null;
  tablero.capaResultado = null;
  dom.tablero.classList.remove("bloqueado");

  dom.progresoRonda.textContent = `Pizza ${estado.indiceActual + 1} de ${PIZZAS_POR_RONDA}`;
  dom.chipPorciones.textContent = `${pizza.producto.porciones} PORCIONES`;
  dom.chipSabor.textContent = nombrePizza(pizza);
  dom.instruccion.textContent = textoInstruccion(pizza);
  dom.tablero.setAttribute("aria-label",
    `${nombrePizza(pizza)} en la mesa de corte: ${pizza.producto.porciones} porciones. Deslizá de un borde al otro para cortar.`);
  dom.explicacion.classList.add("oculto");
  limpiarAviso();
  renderPips(cortesPedidos(pizza));

  dom.estadoJuego.classList.remove("mj-slide-out");
  dom.estadoJuego.classList.add("mj-slide-in");
  setTimeout(() => dom.estadoJuego.classList.remove("mj-slide-in"), 400);

  ajustarTablero();
  iniciarTimerPizza(segundosPizza(pizza));
}

function terminarPizza(porTiempo) {
  if (estado.terminada) return;
  estado.terminada = true;

  detenerTimerPizza();
  clearTimeout(estado.timeoutEvaluar);
  estado.trazo = null;
  estado.ancla = null;
  estado.animCorte = null;
  dom.tablero.classList.add("bloqueado");
  limpiarAviso();

  const pizza = pizzaActual();
  const evaluacion = evaluarPizza(pizza, estado.cortes);
  estado.piezas = evaluacion.piezas;
  prerenderResultado();

  estado.resultados.push({
    puntos: evaluacion.puntos,
    exacta: evaluacion.exacta,
    enOrden: evaluacion.enOrden,
    porciones: evaluacion.porciones,
    pedidas: pizza.producto.porciones,
    producto: pizza.producto.nombre,
    nombre: nombrePizza(pizza),
    porTiempo: porTiempo,
    imagen: capturarMiniatura(),   // también deja dibujado el resultado
  });

  mostrarResultadoPizza(pizza, evaluacion, porTiempo);

  if (evaluacion.puntos >= 75) sonidoAcierto();
  else if (evaluacion.puntos >= 50) sonidoNeutro();
  else sonidoError();
}

function textoDetalle(pizza, evaluacion) {
  const pedidas = pizza.producto.porciones;
  let texto = evaluacion.porciones > pedidas
    ? `Porciones: ${evaluacion.porciones} (la comanda pide ${pedidas})`
    : `Porciones: ${evaluacion.porciones} de ${pedidas}`;

  if (evaluacion.recortes > 0) {
    texto += ` + ${evaluacion.recortes} ${evaluacion.recortes === 1 ? "recorte" : "recortes"}`;
  }
  if (evaluacion.porciones > 1) {
    texto += ` · más grande ${porcentaje(evaluacion.mayor)} · más chica ${porcentaje(evaluacion.menor)}` +
             ` · ideal ${porcentaje(1 / pedidas)}`;
  }
  texto += evaluacion.enOrden ? " · orden ✓" : ` · orden ✗ (−${PENALIZACION_ORDEN})`;
  return texto;
}

function mostrarResultadoPizza(pizza, evaluacion, porTiempo) {
  const calificacion = calificar(evaluacion.puntos);
  const titulo = porTiempo && estado.cortes.length < cortesPedidos(pizza) ? "¡Tiempo!" : calificacion.titulo;

  dom.explicacionTitulo.textContent = `${titulo} · ${evaluacion.puntos} pts`;
  dom.explicacionDetalle.textContent = textoDetalle(pizza, evaluacion);
  dom.explicacionTexto.textContent = diagnosticar(pizza, estado.cortes, evaluacion);
  dom.explicacion.className = `mj7-explicacion ${calificacion.color}`;
  dom.btnSiguiente.disabled = false;
  dom.btnSiguiente.textContent =
    estado.indiceActual + 1 >= PIZZAS_POR_RONDA ? "Ver resultados" : "Siguiente pizza";

  // En pantallas chicas el panel queda abajo de la mesa
  dom.explicacion.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function avanzarPizza() {
  // Evita avanzar dos veces con doble toque en "Siguiente"
  if (dom.btnSiguiente.disabled) return;
  dom.btnSiguiente.disabled = true;

  estado.indiceActual++;

  if (estado.indiceActual >= PIZZAS_POR_RONDA) {
    finalizarRonda();
    return;
  }

  dom.estadoJuego.classList.add("mj-slide-out");
  setTimeout(() => {
    dom.estadoJuego.classList.remove("mj-slide-out");
    window.scrollTo({ top: 0, behavior: "smooth" });
    mostrarPizzaActual();
  }, 400);
}


/* ============================================================
   14. PANTALLA DE RESULTADOS
   ============================================================ */

function renderGaleria() {
  dom.galeriaLista.innerHTML = "";

  estado.resultados.forEach((resultado, i) => {
    const item = crearEl("li", `mj7-galeria__item ${calificar(resultado.puntos).color}`);

    const img = crearEl("img", "mj7-galeria__img");
    img.src = resultado.imagen;
    img.alt = `Pizza ${i + 1}, ${resultado.nombre}: ${resultado.puntos} puntos`;
    item.appendChild(img);

    item.appendChild(crearEl("span", "mj7-galeria__puntos", `${resultado.puntos} pts`));
    item.appendChild(crearEl("span", "mj7-galeria__producto", resultado.producto));

    let nota = resultado.exacta
      ? `${resultado.pedidas} porciones ✓`
      : `${resultado.porciones} de ${resultado.pedidas} porciones`;
    if (!resultado.enOrden) nota += " · orden ✗";
    item.appendChild(crearEl("span", "mj7-galeria__nota", nota));

    dom.galeriaLista.appendChild(item);
  });
}

function finalizarRonda() {
  detenerTimerPizza();

  const suma = estado.resultados.reduce((total, r) => total + r.puntos, 0);
  const promedio = Math.round(suma / PIZZAS_POR_RONDA);
  const exactas = estado.resultados.filter(r => r.exacta).length;
  const enOrden = estado.resultados.filter(r => r.enOrden).length;

  // Semáforo del promedio — Verde: 85+ | Amarillo: 65-84 | Rojo: < 65
  let colorPuntos = "verde";
  if (promedio < 65) colorPuntos = "rojo";
  else if (promedio < 85) colorPuntos = "amarillo";

  dom.puntosTotal.textContent = `${promedio} pts`;
  dom.puntosTotal.className = `mj-tiempo-total ${colorPuntos}`;
  dom.statExactas.textContent = `${exactas} / ${PIZZAS_POR_RONDA}`;
  dom.statOrden.textContent = `${enOrden} / ${PIZZAS_POR_RONDA}`;

  const rondaValida = exactas === PIZZAS_POR_RONDA;
  const puntosRecordPrevio = puntosDelRecord(obtenerRecord());

  let esNuevoRecord = false;
  if (rondaValida && (puntosRecordPrevio === null || promedio > puntosRecordPrevio)) {
    esNuevoRecord = true;
    guardarRecord(promedio);
  }

  dom.statRecordAnterior.textContent = puntosRecordPrevio !== null ? `${puntosRecordPrevio} pts` : "--";

  if (esNuevoRecord) {
    dom.statRecordNuevo.textContent = `${promedio} pts`;
    dom.badgeRecord.classList.remove("oculto");
    setTimeout(sonidoFanfare, 200);
  } else {
    dom.statRecordNuevo.textContent = puntosRecordPrevio !== null ? `${puntosRecordPrevio} pts` : "--";
    dom.badgeRecord.classList.add("oculto");
  }

  dom.mensajeRecord.classList.toggle("oculto", rondaValida);
  dom.mensajeRecord.textContent = rondaValida
    ? ""
    : `Para registrar récord necesitás la cantidad exacta de porciones en las ${PIZZAS_POR_RONDA} pizzas ` +
      `(lograste ${exactas}). ¡Intentalo de nuevo!`;

  renderGaleria();
  mostrarEstado("resultado");
  window.scrollTo({ top: 0 });
}


/* ============================================================
   15. INICIO DE RONDA Y RESET
   ============================================================ */

function iniciarRonda() {
  // Web Audio API requiere interacción del usuario antes de sonar
  inicializarAudio();

  estado.pizzas = armarPizzasRonda();
  estado.indiceActual = 0;
  estado.resultados = [];

  mostrarEstado("juego");
  window.scrollTo({ top: 0 });
  mostrarPizzaActual();
}

function volverAlMenuPre() {
  detenerTimerPizza();
  clearTimeout(estado.timeoutEvaluar);
  mostrarRecordEnPantallaPre();
  mostrarEstado("pre");
}


/* ============================================================
   16. INICIALIZACIÓN
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
    chipPorciones: document.getElementById("chip-porciones"),
    chipSabor: document.getElementById("chip-sabor"),
    instruccion: document.getElementById("instruccion"),
    tablero: document.getElementById("tablero"),
    pipsCortes: document.getElementById("pips-cortes"),
    aviso: document.getElementById("aviso"),
    explicacion: document.getElementById("explicacion"),
    explicacionTitulo: document.getElementById("explicacion-titulo"),
    explicacionDetalle: document.getElementById("explicacion-detalle"),
    explicacionTexto: document.getElementById("explicacion-texto"),
    btnSiguiente: document.getElementById("btn-siguiente"),

    badgeRecord: document.getElementById("badge-record"),
    mensajeRecord: document.getElementById("mensaje-record"),
    puntosTotal: document.getElementById("puntos-total"),
    statExactas: document.getElementById("stat-exactas"),
    statOrden: document.getElementById("stat-orden"),
    statRecordAnterior: document.getElementById("stat-record-anterior"),
    statRecordNuevo: document.getElementById("stat-record-nuevo"),
    galeriaLista: document.getElementById("galeria-lista"),

    btnJugarNuevo: document.getElementById("btn-jugar-nuevo"),
    btnVolverMenu: document.getElementById("btn-volver-menu"),

    btnSonido: document.getElementById("btn-sonido"),
    iconoSonido: document.getElementById("icono-sonido"),
  };

  cargarPreferenciaSonido();
  mostrarRecordEnPantallaPre();

  dom.btnComenzar.addEventListener("click", iniciarRonda);
  dom.btnJugarNuevo.addEventListener("click", iniciarRonda);
  dom.btnVolverMenu.addEventListener("click", volverAlMenuPre);
  dom.btnSiguiente.addEventListener("click", avanzarPizza);
  dom.btnSonido.addEventListener("click", () => {
    inicializarAudio();
    alternarSonido();
  });

  dom.tablero.addEventListener("pointerdown", alPresionar);
  dom.tablero.addEventListener("pointermove", alMover);
  dom.tablero.addEventListener("pointerup", alSoltar);
  dom.tablero.addEventListener("pointercancel", alCancelar);
  dom.tablero.addEventListener("contextmenu", ev => ev.preventDefault());

  // Rotar el celular o cambiar el ancho de la ventana rehace el tablero
  window.addEventListener("resize", () => requestAnimationFrame(ajustarTablero));

  mostrarEstado("pre");
}

// Esperar a que el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializar);
} else {
  inicializar();
}
