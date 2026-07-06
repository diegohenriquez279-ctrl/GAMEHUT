/* ============================================================
   PROJECT GAMEHUT — Minijuego 4: El pedido llega
   Banco de datos: 8 recetas con orden forzado de armado
   Fuente: Documentos de cierre Chat 8 y Chat 8.2
   ============================================================ */

const RECETAS_MJ4 = [

  {
    id: 'cavatini-pollo-brocoli',
    nombre: 'Cavatini Pollo Brócoli',
    salsa: 'Alfredo local',
    pasos: ['cavatini', 'brocoli', 'pollo', 'salsa-alfredo-local', 'mozzarella'],
    // Cada paso apunta al ID del SVG de estado acumulado correspondiente
    secuenciaVisual: [
      'secuencia-cavatini-pollo-brocoli-p1',
      'secuencia-cavatini-pollo-brocoli-p2',
      'secuencia-cavatini-pollo-brocoli-p3',
      'secuencia-cavatini-pollo-brocoli-p4',
      'secuencia-cavatini-pollo-brocoli-p5'
    ]
  },

  {
    id: 'chicken-primavera',
    nombre: 'Chicken Primavera',
    salsa: 'USA',
    pasos: ['rotini', 'brocoli', 'pollo', 'pimientos', 'salsa-usa', 'mozzarella'],
    secuenciaVisual: [
      'secuencia-chicken-primavera-p1',
      'secuencia-chicken-primavera-p2',
      'secuencia-chicken-primavera-p3',
      'secuencia-chicken-primavera-p4',
      'secuencia-chicken-primavera-p5',
      'secuencia-chicken-primavera-p6'
    ]
  },

  {
    id: 'rotini-camarones-chipotle',
    nombre: 'Rotini Camarones Chipotle',
    salsa: 'Chipotle',
    pasos: ['rotini', 'camaron', 'pimientos', 'cilantro', 'salsa-chipotle', 'mozzarella'],
    secuenciaVisual: [
      'secuencia-rotini-camarones-chipotle-p1',
      'secuencia-rotini-camarones-chipotle-p2',
      'secuencia-rotini-camarones-chipotle-p3',
      'secuencia-rotini-camarones-chipotle-p4',
      'secuencia-rotini-camarones-chipotle-p5',
      'secuencia-rotini-camarones-chipotle-p6'
    ]
  },

  {
    id: 'rotini-pollo-chipotle',
    nombre: 'Rotini Pollo Chipotle',
    salsa: 'Chipotle',
    pasos: ['rotini', 'pollo', 'pimientos', 'cilantro', 'salsa-chipotle', 'mozzarella'],
    secuenciaVisual: [
      'secuencia-rotini-pollo-chipotle-p1',
      'secuencia-rotini-pollo-chipotle-p2',
      'secuencia-rotini-pollo-chipotle-p3',
      'secuencia-rotini-pollo-chipotle-p4',
      'secuencia-rotini-pollo-chipotle-p5',
      'secuencia-rotini-pollo-chipotle-p6'
    ]
  },

  {
    id: 'pollo-toscano-alfredo',
    nombre: 'Pollo Toscano Alfredo',
    salsa: 'Alfredo local',
    // NOTA: receta oficial son 7 pasos (tomate cherry después del queso).
    // Hasta que se rescate el SVG del paso 7, se trabaja con 6 pasos.
    // El motor reutiliza el último paso de la secuencia visual si faltase.
    pasos: ['cavatini', 'pollo', 'hongos', 'espinaca', 'salsa-alfredo-local', 'mozzarella', 'tomate-cherry'],
    secuenciaVisual: [
      'secuencia-pollo-toscano-alfredo-p1',
      'secuencia-pollo-toscano-alfredo-p2',
      'secuencia-pollo-toscano-alfredo-p3',
      'secuencia-pollo-toscano-alfredo-p4',
      'secuencia-pollo-toscano-alfredo-p5',
      'secuencia-pollo-toscano-alfredo-p6'
      // 'secuencia-pollo-toscano-alfredo-p7' — pendiente de rescatar del Chat 8.2
    ]
  },

  {
    id: 'camarones-4-quesos',
    nombre: 'Camarones 4 Quesos',
    salsa: 'Tres quesos',
    pasos: ['cavatini', 'camaron', 'salsa-tres-quesos', 'grand-cheese'],
    secuenciaVisual: [
      'secuencia-camarones-4-quesos-p1',
      'secuencia-camarones-4-quesos-p2',
      'secuencia-camarones-4-quesos-p3',
      'secuencia-camarones-4-quesos-p4'
    ]
  },

  {
    id: 'pollo-tocino-carbonara',
    nombre: 'Pollo Tocino Carbonara',
    salsa: 'Carbonara',
    // Excepción de orden: tocino va DESPUÉS del queso
    pasos: ['rotini', 'pollo', 'salsa-carbonara', 'grand-cheese', 'tocino'],
    secuenciaVisual: [
      'secuencia-pollo-tocino-carbonara-p1',
      'secuencia-pollo-tocino-carbonara-p2',
      'secuencia-pollo-tocino-carbonara-p3',
      'secuencia-pollo-tocino-carbonara-p4',
      'secuencia-pollo-tocino-carbonara-p5'
    ]
  },

  {
    id: 'cavatini-casa',
    nombre: 'Cavatini de la Casa',
    salsa: 'Casa original',
    pasos: ['cavatini', 'mezcla-casa', 'salsa-casa-original', 'mozzarella'],
    secuenciaVisual: [
      'secuencia-cavatini-casa-p1',
      'secuencia-cavatini-casa-p2',
      'secuencia-cavatini-casa-p3',
      'secuencia-cavatini-casa-p4'
    ]
  }

];

/* ============================================================
   CONFIGURACIÓN DE LA MESA DE TRABAJO TIPO SUBWAY
   21 ingredientes que el asociado puede arrastrar al pyrex.
   El Jamón Virginia es DISTRACTOR — no se usa en ninguna receta.
   ============================================================ */

const INGREDIENTES_MESA_MJ4 = [
  // Pastas
  { id: 'rotini', nombre: 'Rotini', categoria: 'pasta' },
  { id: 'cavatini', nombre: 'Cavatini', categoria: 'pasta' },

  // Proteínas
  { id: 'pollo', nombre: 'Pollo', categoria: 'proteina' },
  { id: 'camaron', nombre: 'Camarón', categoria: 'proteina' },
  { id: 'tocino', nombre: 'Tocino', categoria: 'proteina' },

  // Vegetales
  { id: 'brocoli', nombre: 'Brócoli', categoria: 'vegetal' },
  { id: 'pimientos', nombre: 'Pimientos', categoria: 'vegetal' },
  { id: 'cilantro', nombre: 'Cilantro', categoria: 'vegetal' },
  { id: 'hongos', nombre: 'Hongos', categoria: 'vegetal' },
  { id: 'espinaca', nombre: 'Espinaca', categoria: 'vegetal' },
  { id: 'tomate-cherry', nombre: 'Tomate cherry', categoria: 'vegetal' },

  // Quesos
  { id: 'mozzarella', nombre: 'Mozzarella', categoria: 'queso' },
  { id: 'grand-cheese', nombre: 'Grand Cheese', categoria: 'queso' },

  // Mezclas
  { id: 'mezcla-casa', nombre: 'Mezcla Casa', categoria: 'mezcla' },
  { id: 'jamon-virginia', nombre: 'Jamón Virginia', categoria: 'mezcla', distractor: true },

  // Salsas
  { id: 'salsa-alfredo-local', nombre: 'Alfredo Local', categoria: 'salsa' },
  { id: 'salsa-usa', nombre: 'Alfredo USA', categoria: 'salsa' },
  { id: 'salsa-chipotle', nombre: 'Chipotle', categoria: 'salsa' },
  { id: 'salsa-carbonara', nombre: 'Carbonara', categoria: 'salsa' },
  { id: 'salsa-tres-quesos', nombre: 'Tres Quesos', categoria: 'salsa' },
  { id: 'salsa-casa-original', nombre: 'Casa Original', categoria: 'salsa' }
];

/* ============================================================
   CONFIGURACIÓN GLOBAL DEL MINIJUEGO
   ============================================================ */

const CONFIG_MJ4 = {
  // Tiempo por comanda = 7 segundos por cada ingrediente pre-horno
  segundosPorIngrediente: 7,

  // Penalización en segundos por error (ingrediente incorrecto o fuera de orden)
  penalizacionError: 2,

  // Número de comandas por ronda
  comandasPorRonda: 6,

  // Umbral mínimo de comandas completadas para que un resultado cuente como récord válido
  umbralRecord: 4,

  // Distribución del semáforo del timer
  umbralAmarillo: 0.50,  // 50% del tiempo restante
  umbralRojo: 0.25       // 25% del tiempo restante
};