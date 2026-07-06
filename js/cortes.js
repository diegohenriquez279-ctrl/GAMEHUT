/* ============================================================
   PROJECT GAMEHUT — Minijuego 3: "El corte correcto"
   Banco de datos: cortes.js
   Área: Ensambles
   ------------------------------------------------------------
   Modelo de la pregunta:
     Se muestra un INGREDIENTE ENTERO + un CONTEXTO ("para qué"),
     y el asociado elige el CORTE correcto entre varias opciones
     visuales.
   Mecánica: selección (tap / clic), no arrastre.
   Récord: mejor tiempo total de ronda (localStorage vía scores.js).

   Este archivo SOLO define datos. La lógica vive en minijuego-3.js
   y los dibujos SVG en cortes-svg.js (se cargan por separado).
   ============================================================ */

/* --- 1. BIBLIOTECA DE CORTES --------------------------------
   Cada corte es una opción posible del juego.
   svgId  -> apunta al dibujo aprobado en cortes-svg.js
   etiqueta -> texto que puede mostrarse bajo la opción
   ingrediente -> informativo (de qué ingrediente es ese corte)
   tecnica -> técnica de corte; el motor la usa para NO repetirla
              al generar señuelos del mismo ingrediente */
const CORTES = {
  tomate_rodaja:      { id: "tomate_rodaja",      ingrediente: "Tomate",    etiqueta: "Rodaja",       tecnica: "rodajas",  svgId: "corte_tomate_rodaja" },
  tomate_cubos:       { id: "tomate_cubos",       ingrediente: "Tomate",    etiqueta: "Cubos",        tecnica: "cubos",    svgId: "corte_tomate_cubos" },
  pepino_rodaja:      { id: "pepino_rodaja",      ingrediente: "Pepino",    etiqueta: "Rodaja",       tecnica: "rodajas",  svgId: "corte_pepino_rodaja" },
  cilantro_hebras:    { id: "cilantro_hebras",    ingrediente: "Cilantro",  etiqueta: "Picado medio", tecnica: "medio",    svgId: "corte_cilantro_hebras" },
  cebolla_fino:       { id: "cebolla_fino",       ingrediente: "Cebolla",   etiqueta: "Picado fino",  tecnica: "fino",     svgId: "corte_cebolla_fino" },
  albahaca_hoja:      { id: "albahaca_hoja",      ingrediente: "Albahaca",  etiqueta: "Hoja entera",  tecnica: "hoja",     svgId: "corte_albahaca_hoja" },
  pollo_tiras:        { id: "pollo_tiras",        ingrediente: "Pollo",     etiqueta: "Tiras 1/8\"",  tecnica: "tiras",    svgId: "corte_pollo_tiras" },
  zanahoria_bastones: { id: "zanahoria_bastones", ingrediente: "Zanahoria", etiqueta: "Bastones",     tecnica: "bastones", svgId: "corte_zanahoria_bastones" },
  apio_bastones:      { id: "apio_bastones",      ingrediente: "Apio",      etiqueta: "Bastones",     tecnica: "bastones", svgId: "corte_apio_bastones" }
};

/* --- 2. INGREDIENTES ENTEROS (enunciado) -------------------- */
const ENTEROS = {
  tomate:    { id: "tomate",    nombre: "Tomate",    svgId: "entero_tomate" },
  pepino:    { id: "pepino",    nombre: "Pepino",    svgId: "entero_pepino" },
  cilantro:  { id: "cilantro",  nombre: "Cilantro",  svgId: "entero_cilantro" },
  cebolla:   { id: "cebolla",   nombre: "Cebolla",   svgId: "entero_cebolla" },
  albahaca:  { id: "albahaca",  nombre: "Albahaca",  svgId: "entero_albahaca" },
  pollo:     { id: "pollo",     nombre: "Pollo",     svgId: "entero_pollo" },
  zanahoria: { id: "zanahoria", nombre: "Zanahoria", svgId: "entero_zanahoria" },
  apio:      { id: "apio",      nombre: "Apio",      svgId: "entero_apio" }
};

/* --- 3. PREGUNTAS -------------------------------------------
   ingredienteEntero : qué se muestra arriba (clave de ENTEROS)
   contexto          : el "para qué" — SIEMPRE presente, elimina
                       la ambigüedad (un mismo ingrediente puede
                       tener cortes distintos según el producto)
   corteCorrecto     : id del corte correcto (clave de CORTES)
   decoysSugeridos   : señuelos curados (near-miss) que el motor
                       intentará incluir SIEMPRE; el resto de las
                       opciones las completa al azar desde CORTES
   dificultad        : "facil" | "medio" | "dificil"
*/
const PREGUNTAS = [
  /* MEDIO — el tomate cambia de corte según el producto.
     Ambos cortes son rojos, así que no se adivina por color:
     hay que LEER el contexto. */
  { id: "q_tomate_toaster", ingredienteEntero: "tomate", contexto: "para el toaster",
    corteCorrecto: "tomate_rodaja", decoysSugeridos: ["tomate_cubos"], dificultad: "medio" },
  { id: "q_tomate_chimol",  ingredienteEntero: "tomate", contexto: "para el chimol",
    corteCorrecto: "tomate_cubos",  decoysSugeridos: ["tomate_rodaja"], dificultad: "medio" },

  /* DIFICIL — el par más fino del juego: picado medio (cilantro)
     vs picado fino (cebolla). Cada uno es el near-miss del otro. */
  { id: "q_cilantro", ingredienteEntero: "cilantro", contexto: "para el chimol",
    corteCorrecto: "cilantro_hebras", decoysSugeridos: ["cebolla_fino"],  dificultad: "dificil" },
  { id: "q_cebolla",  ingredienteEntero: "cebolla",  contexto: "para el chimol",
    corteCorrecto: "cebolla_fino",    decoysSugeridos: ["cilantro_hebras"], dificultad: "dificil" },

  /* FACIL — técnica única y distintiva (el motor completa con
     cortes variados, no con el mismo tipo). */
  { id: "q_pepino",    ingredienteEntero: "pepino",    contexto: "para el toaster",
    corteCorrecto: "pepino_rodaja",      decoysSugeridos: [], dificultad: "facil" },
  { id: "q_albahaca",  ingredienteEntero: "albahaca",  contexto: "para decorar la pizza",
    corteCorrecto: "albahaca_hoja",      decoysSugeridos: [], dificultad: "facil" },
  { id: "q_pollo",     ingredienteEntero: "pollo",     contexto: "para todos los productos",
    corteCorrecto: "pollo_tiras",        decoysSugeridos: [], dificultad: "facil" },
  { id: "q_zanahoria", ingredienteEntero: "zanahoria", contexto: "para el plato de alitas",
    corteCorrecto: "zanahoria_bastones", decoysSugeridos: [], dificultad: "facil" },
  { id: "q_apio",      ingredienteEntero: "apio",      contexto: "para el plato de alitas",
    corteCorrecto: "apio_bastones",      decoysSugeridos: [], dificultad: "facil" }
];

/* --- 4. CONFIGURACIÓN DE LA RONDA --------------------------- */
const CONFIG_RONDA = {
  preguntasPorRonda: 6,

  /* Composición por dificultad (rampa ascendente). Suma = 6.
     Al tomar las 2 medias y las 2 difíciles, la ronda SIEMPRE
     incluye los dos pares que enseñan (tomate por contexto y
     cilantro/cebolla). Las fáciles se eligen al azar de las 5. */
  composicion: { facil: 2, medio: 2, dificil: 2 },
  ordenPorDificultad: ["facil", "medio", "dificil"], // fácil primero

  /* Cuántas opciones se muestran por pregunta (sube con dificultad). */
  opcionesPorPregunta: { facil: 3, medio: 4, dificil: 4 },

  /* Segundos por pregunta según dificultad. */
  tiempoPorPregunta: { facil: 10, medio: 12, dificil: 13 },

  /* Metodología de comandas Pizza Hut: % del tiempo en cada color.
     (verde -> amarillo -> rojo; en rojo suena el tick por segundo) */
  semaforo: { verde: 0.5, amarillo: 0.25, rojo: 0.25 },

  /* El récord (menor tiempo total de ronda) solo cuenta si el
     asociado acierta al menos esta cantidad de las 6 preguntas. */
  minAciertosParaRecord: 4,

  /* Clave de localStorage usada por scores.js (igual patrón que MJ1/MJ2). */
  scoreId: "minijuego-3"
};

/* --- 5. SEÑUELOS POR INGREDIENTE ----------------------------
   Técnicas INCORRECTAS del MISMO ingrediente que el motor puede
   generar como opciones (vía GameHutSVG.decoy). El motor excluye
   automáticamente la técnica correcta de cada pregunta.
   "entero" = el ingrediente sin cortar (señuelo válido y claro).
   Técnicas válidas: cubos | bastones | rodajas | fino | medio |
                     grueso | entero
   (tomate y cebolla usan sus cortes reales como near-miss curado,
    por eso aquí solo se listan las técnicas extra de relleno). */
const DECOYS_POR_INGREDIENTE = {
  tomate:    ["bastones", "picado", "entero"],
  pepino:    ["cubos", "bastones", "picado", "entero"],
  zanahoria: ["rodajas", "cubos", "picado", "entero"],
  cebolla:   ["rodajas", "cubos", "bastones", "entero"],
  apio:      ["rodajas", "cubos", "picado", "entero"],
  pollo:     ["cubos", "rodajas", "picado", "entero"],
  cilantro:  ["fino", "grueso", "entero"],
  albahaca:  ["picado", "entero"]
};