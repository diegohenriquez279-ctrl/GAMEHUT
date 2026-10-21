/* ============================================================
   GAMEHUT - BANCO DE ESCENARIOS
   Minijuego 6: ¿Cuál sale primero?
   Área: Introductorios
   Total: 24 escenarios distribuidos en 4 subtemas (6 c/u)

   TIPOS DE ESCENARIO
   - "elegir": se toca el recipiente correcto. `correcta` es el
     índice dentro de `productos`.
   - "accion": los recipientes (opcionales) solo dan contexto y
     se responde con `opciones`. `correcta` es el índice dentro
     de `opciones`.

   FECHAS RELATIVAS
   `prep` y `vence` son días respecto a HOY (0 = hoy, -1 = ayer,
   2 = pasado mañana). El juego las convierte a dd/mm con la
   fecha real del día, así las etiquetas nunca quedan viejas.

   OTROS CAMPOS DEL PRODUCTO (todos opcionales)
   - venceHora:   hora de vencimiento (fila "HORA" de la etiqueta)
   - sinEtiqueta: el recipiente no tiene etiqueta
   - ilegible:    la etiqueta existe pero no se puede leer
   - etiqueta:    texto libre en la etiqueta (ej. "Recibido hoy")
   - ubicacion:   dónde está en el estante ("Adelante", "Al fondo")
   - rol:         cinta superior ("En el estante", "Recién llegado")
   - nota:        alerta visible en la tarjeta ("Huele agrio", "48°F")
   ============================================================ */

const BANCO_ESCENARIOS_MJ6 = [

  /* ---------- PEPS: QUÉ SE USA PRIMERO (6) ---------- */
  {
    id: "R01",
    subtema: "peps",
    tipo: "elegir",
    situacion: "Tenés que reponer queso en la línea. ¿Cuál tomás?",
    productos: [
      { nombre: "Queso mozzarella", emoji: "🧀", prep: -2, vence: 1 },
      { nombre: "Queso mozzarella", emoji: "🧀", prep: 0, vence: 3 },
      { nombre: "Queso mozzarella", emoji: "🧀", prep: -1, vence: 2 }
    ],
    correcta: 0,
    explicacion: "PEPS: primero en entrar, primero en salir. Sale el que vence antes.",
    tiempo: 25
  },
  {
    id: "R02",
    subtema: "peps",
    tipo: "elegir",
    situacion: "Necesitás salsa para la línea. ¿Cuál usás?",
    productos: [
      { nombre: "Salsa de pizza", emoji: "🍅", prep: -3, vence: -1 },
      { nombre: "Salsa de pizza", emoji: "🍅", prep: -2, vence: 0 },
      { nombre: "Salsa de pizza", emoji: "🍅", prep: 0, vence: 2 }
    ],
    correcta: 1,
    explicacion: "La que venció ayer ya no se usa: se descarta. De las vigentes, sale primero la que vence hoy.",
    tiempo: 25
  },
  {
    id: "R03",
    subtema: "peps",
    tipo: "elegir",
    situacion: "Vas a reponer pepperoni. ¿Qué recipiente tomás?",
    productos: [
      { nombre: "Pepperoni", emoji: "🍕", sinEtiqueta: true },
      { nombre: "Pepperoni", emoji: "🍕", prep: -1, vence: 1 },
      { nombre: "Pepperoni", emoji: "🍕", prep: 0, vence: 3 }
    ],
    correcta: 1,
    explicacion: "Sin etiqueta no sabés cuándo se preparó, así que no se usa. De los etiquetados, sale primero el que vence mañana.",
    tiempo: 25
  },
  {
    id: "R04",
    subtema: "peps",
    tipo: "elegir",
    situacion: "Son las 3:00 p.m. y te piden hongos para la línea. ¿Cuál tomás?",
    productos: [
      { nombre: "Hongos", emoji: "🍄", prep: -2, vence: 0, venceHora: "1:00 p.m." },
      { nombre: "Hongos", emoji: "🍄", prep: -1, vence: 1, venceHora: "1:00 p.m." },
      { nombre: "Hongos", emoji: "🍄", prep: 0, vence: 2, venceHora: "1:00 p.m." }
    ],
    correcta: 1,
    explicacion: "El que vencía hoy a la 1:00 p.m. ya venció hace dos horas. Sale el que vence mañana.",
    tiempo: 25
  },
  {
    id: "R05",
    subtema: "peps",
    tipo: "elegir",
    situacion: "Vas a llevar jamón a la línea. ¿Cuál tomás?",
    productos: [
      { nombre: "Jamón", emoji: "🥓", prep: -1, vence: 3, ubicacion: "Adelante" },
      { nombre: "Jamón", emoji: "🥓", prep: -3, vence: 1, ubicacion: "Al fondo" },
      { nombre: "Jamón", emoji: "🥓", prep: -2, vence: 2, ubicacion: "En medio" }
    ],
    correcta: 1,
    explicacion: "No se toma lo que está más a mano: se lee la etiqueta. El del fondo vence primero, así que sale primero (y estaba mal acomodado).",
    tiempo: 25
  },
  {
    id: "R06",
    subtema: "peps",
    tipo: "elegir",
    situacion: "Necesitás chile verde picado. ¿Cuál usás?",
    productos: [
      { nombre: "Chile verde", emoji: "🫑", ilegible: true },
      { nombre: "Chile verde", emoji: "🫑", prep: 0, vence: 2 },
      { nombre: "Chile verde", emoji: "🫑", prep: -1, vence: 1 }
    ],
    correcta: 2,
    explicacion: "Una etiqueta que no se lee vale lo mismo que no tener etiqueta. De los demás, sale el que vence mañana.",
    tiempo: 25
  },

  /* ---------- ETIQUETADO (6) ---------- */
  {
    id: "R07",
    subtema: "etiquetado",
    tipo: "accion",
    situacion: "Acabás de porcionar cebolla. ¿Qué hacés antes de guardarla en el cuarto frío?",
    productos: [
      { nombre: "Cebolla", emoji: "🧅", sinEtiqueta: true, rol: "Recién preparado" }
    ],
    opciones: [
      "Etiquetarla con producto, fecha de preparación y de vencimiento",
      "Guardarla y etiquetarla al final del turno",
      "Guardarla sin etiqueta porque se va a usar hoy"
    ],
    correcta: 0,
    explicacion: "Todo producto preparado se etiqueta en el momento, antes de guardarse. Si no, se pierde la rotación.",
    tiempo: 35
  },
  {
    id: "R08",
    subtema: "etiquetado",
    tipo: "accion",
    situacion: "Encontrás este recipiente sin etiqueta en el cuarto frío. ¿Qué hacés?",
    productos: [
      { nombre: "Pollo", emoji: "🍗", sinEtiqueta: true, rol: "En el estante" }
    ],
    opciones: [
      "Descartarlo y avisar al encargado",
      "Ponerle una etiqueta con la fecha de hoy",
      "Usarlo primero para que no se pierda"
    ],
    correcta: 0,
    explicacion: "Si no se sabe cuándo se preparó, no se puede asegurar que sea seguro. Nunca se le pone una fecha a ojo.",
    tiempo: 35
  },
  {
    id: "R09",
    subtema: "etiquetado",
    tipo: "accion",
    situacion: "Sacás queso del congelador para descongelarlo. ¿Qué hacés con la etiqueta?",
    productos: [
      { nombre: "Queso mozzarella", emoji: "🧀", etiqueta: "Congelado", rol: "Del congelador" }
    ],
    opciones: [
      "Etiquetarlo con la fecha en que salió del congelador y su nueva fecha de vencimiento",
      "Dejar la etiqueta del congelador, ya trae fecha",
      "Etiquetarlo cuando ya esté descongelado"
    ],
    correcta: 0,
    explicacion: "Al sacarlo a descongelar empieza una vida útil nueva: se rotula en ese momento con su nueva fecha.",
    tiempo: 35
  },
  {
    id: "R10",
    subtema: "etiquetado",
    tipo: "accion",
    situacion: "Te toca reponer salsa y al recipiente le queda un poco de la de ayer. ¿Qué hacés?",
    productos: [
      { nombre: "Salsa de pizza", emoji: "🍅", prep: -1, vence: 1, rol: "Queda poca" }
    ],
    opciones: [
      "Usar un recipiente limpio para la nueva y terminar primero la anterior",
      "Echar la salsa nueva encima y dejar la etiqueta vieja",
      "Echar la salsa nueva encima y ponerle etiqueta nueva"
    ],
    correcta: 0,
    explicacion: "Nunca se mezcla producto viejo con nuevo: se pierde la fecha real y la rotación.",
    tiempo: 35
  },
  {
    id: "R11",
    subtema: "etiquetado",
    tipo: "accion",
    situacion: "La etiqueta de este recipiente se mojó y ya no se lee la fecha. ¿Qué hacés?",
    productos: [
      { nombre: "Carne de res", emoji: "🥩", ilegible: true, rol: "En el estante" }
    ],
    opciones: [
      "Tratarlo como producto sin etiqueta: descartarlo y avisar",
      "Calcular la fecha según cómo se ve el producto",
      "Usarlo hoy para salir rápido de él"
    ],
    correcta: 0,
    explicacion: "Una etiqueta que no se lee vale lo mismo que no tener etiqueta.",
    tiempo: 35
  },
  {
    id: "R12",
    subtema: "etiquetado",
    tipo: "accion",
    situacion: "¿Qué datos debe llevar, como mínimo, la etiqueta de un producto preparado?",
    opciones: [
      "Producto, fecha de preparación y fecha de vencimiento",
      "Solo el nombre del producto",
      "Solo la fecha en que llegó a la tienda"
    ],
    correcta: 0,
    explicacion: "Sin el producto y las dos fechas no se puede rotar ni saber cuándo descartar.",
    tiempo: 25
  },

  /* ---------- RECEPCIÓN Y ACOMODO (6) ---------- */
  {
    id: "R13",
    subtema: "recepcion",
    tipo: "accion",
    situacion: "Llegó el pedido de queso. ¿Dónde lo acomodás?",
    productos: [
      { nombre: "Queso mozzarella", emoji: "🧀", vence: 2, rol: "En el estante" },
      { nombre: "Queso mozzarella", emoji: "🧀", vence: 9, rol: "Recién llegado" }
    ],
    opciones: [
      "Atrás del que ya estaba, para que el viejo quede adelante",
      "Adelante, para que se vea lo nuevo",
      "Encima del que ya estaba, sin moverlo"
    ],
    correcta: 0,
    explicacion: "Lo nuevo va atrás; lo viejo queda adelante para que se use primero.",
    tiempo: 35
  },
  {
    id: "R14",
    subtema: "recepcion",
    tipo: "accion",
    situacion: "Llega producto congelado mientras estás preparando la línea. ¿Cuándo lo guardás?",
    productos: [
      { nombre: "Caja congelada", emoji: "📦", etiqueta: "Recibido hoy", rol: "Recién llegado" }
    ],
    opciones: [
      "De inmediato, en el congelador",
      "Cuando termine de preparar la línea",
      "Al final del turno, junto con lo demás"
    ],
    correcta: 0,
    explicacion: "Lo congelado y lo refrigerado se guardan de inmediato para no romper la cadena de frío.",
    tiempo: 25
  },
  {
    id: "R15",
    subtema: "recepcion",
    tipo: "accion",
    situacion: "Al recibir, un producto refrigerado marca 48°F. ¿Qué hacés?",
    productos: [
      { nombre: "Producto refrigerado", emoji: "📦", etiqueta: "Recibido hoy", nota: "48°F", rol: "Recién llegado" }
    ],
    opciones: [
      "No recibirlo y avisar al encargado",
      "Recibirlo y meterlo rápido al cuarto frío",
      "Recibirlo y usarlo primero"
    ],
    correcta: 0,
    explicacion: "Lo refrigerado debe estar entre 33° y 41°F. A 48°F ya está en la zona de peligro.",
    tiempo: 35
  },
  {
    id: "R16",
    subtema: "recepcion",
    tipo: "accion",
    situacion: "No había espacio en el estante y alguien dejó una caja de producto en el piso del cuarto frío.",
    productos: [
      { nombre: "Caja de producto", emoji: "📦", etiqueta: "Recibido hoy", nota: "En el piso", rol: "Recién llegado" }
    ],
    opciones: [
      "Subirla a un estante: ningún alimento se guarda en el piso",
      "Dejarla ahí, el cuarto frío está a buena temperatura",
      "Ponerla sobre otra caja en el piso"
    ],
    correcta: 0,
    explicacion: "Los alimentos se guardan siempre separados del suelo (al menos 16 cm).",
    tiempo: 35
  },
  {
    id: "R17",
    subtema: "recepcion",
    tipo: "accion",
    situacion: "En el pedido viene una lata abollada e inflada. ¿Qué hacés?",
    productos: [
      { nombre: "Lata", emoji: "🥫", etiqueta: "Recibido hoy", nota: "Inflada", rol: "Recién llegado" }
    ],
    opciones: [
      "Separarla, no usarla y avisar al encargado",
      "Usarla primero para que no se pierda",
      "Guardarla con las demás si no está rota"
    ],
    correcta: 0,
    explicacion: "Una lata inflada puede tener bacterias peligrosas: nunca se usa.",
    tiempo: 35
  },
  {
    id: "R18",
    subtema: "recepcion",
    tipo: "elegir",
    situacion: "Llegó jamón y estás ordenando el estante. ¿Cuál debe quedar adelante?",
    productos: [
      { nombre: "Jamón", emoji: "🥓", vence: 6, rol: "Recién llegado" },
      { nombre: "Jamón", emoji: "🥓", vence: 2, rol: "En el estante" },
      { nombre: "Jamón", emoji: "🥓", vence: 4, rol: "En el estante" }
    ],
    correcta: 1,
    explicacion: "Adelante va lo que vence primero; lo recién llegado queda al fondo.",
    tiempo: 25
  },

  /* ---------- DESCARTE Y TEMPERATURAS (6) ---------- */
  {
    id: "R19",
    subtema: "descarte",
    tipo: "elegir",
    situacion: "Revisás el cuarto frío al abrir la tienda. ¿Cuál hay que descartar?",
    productos: [
      { nombre: "Tomate", emoji: "🍅", prep: 0, vence: 2 },
      { nombre: "Tomate", emoji: "🍅", prep: -3, vence: -1 },
      { nombre: "Tomate", emoji: "🍅", prep: -1, vence: 1 }
    ],
    correcta: 1,
    explicacion: "El que venció ayer se descarta de inmediato y se reporta. Nunca se le cambia la fecha.",
    tiempo: 25
  },
  {
    id: "R20",
    subtema: "descarte",
    tipo: "accion",
    situacion: "Este producto está dentro de fecha, pero huele agrio. ¿Qué hacés?",
    productos: [
      { nombre: "Salsa de pizza", emoji: "🍅", prep: -1, vence: 2, nota: "Huele agrio" }
    ],
    opciones: [
      "Descartarlo y avisar al encargado",
      "Usarlo, todavía no vence",
      "Mezclarlo con producto fresco"
    ],
    correcta: 0,
    explicacion: "Un alimento seguro es el que está en buenas condiciones, no solo el que tiene fecha vigente.",
    tiempo: 35
  },
  {
    id: "R21",
    subtema: "descarte",
    tipo: "accion",
    situacion: "Ves que alguien volvió a meter al congelador un producto que ya estaba descongelado.",
    productos: [
      { nombre: "Producto descongelado", emoji: "🧊", etiqueta: "Descongelado", rol: "En el congelador" }
    ],
    opciones: [
      "Avisar al encargado: lo descongelado no se vuelve a congelar",
      "Dejarlo ahí, ya está frío otra vez",
      "Sacarlo y descongelarlo sobre la mesa"
    ],
    correcta: 0,
    explicacion: "Volver a congelar un producto descongelado acorta su vida útil y afecta su seguridad.",
    tiempo: 35
  },
  {
    id: "R22",
    subtema: "descarte",
    tipo: "accion",
    situacion: "El termómetro del cuarto frío marca 47°F. ¿Qué hacés?",
    opciones: [
      "Avisar al encargado de inmediato",
      "Esperar a que la temperatura baje sola",
      "Abrir menos la puerta y seguir trabajando"
    ],
    correcta: 0,
    explicacion: "El cuarto frío debe estar a 41°F o menos. Arriba de eso el producto está en la zona de peligro.",
    tiempo: 25
  },
  {
    id: "R23",
    subtema: "descarte",
    tipo: "accion",
    situacion: "Necesitás descongelar queso para mañana. ¿Dónde lo hacés?",
    opciones: [
      "En el cuarto frío, entre 33° y 41°F",
      "Sobre la mesa de la cocina",
      "En agua caliente para que sea más rápido"
    ],
    correcta: 0,
    explicacion: "Se descongela en el cuarto frío para que nunca pase por la zona de peligro (41° a 145°F).",
    tiempo: 25
  },
  {
    id: "R24",
    subtema: "descarte",
    tipo: "accion",
    situacion: "El termómetro del congelador marca 18°F. ¿Qué hacés?",
    opciones: [
      "Avisar al encargado: el máximo permitido es 10°F",
      "Nada, sigue estando por debajo de 32°F",
      "Pasar todo el producto al cuarto frío"
    ],
    correcta: 0,
    explicacion: "El congelador debe estar a 10°F o menos.",
    tiempo: 25
  }
];
