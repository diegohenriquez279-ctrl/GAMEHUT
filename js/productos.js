/**
 * productos.js — Banco de datos del Minijuego 2: ¿Falta algo?
 * Project GameHut | Pizza Hut El Salvador
 * v4 — solo tosters (sopas eliminadas)
 */

const INGREDIENTES = {
  // Proteínas
  pollo:       { nombre: "Pollo fajita",     art: "trocitos", color: "#b86020", cant: "1 topping" },
  jamon:       { nombre: "Jamón de Pavo",    art: "trocitos", color: "#d4a0a0", cant: "3 medias lascas" },
  tocino:      { nombre: "Tocino horneado",  art: "tocino",   color: "#8a2010", cant: "½ Bombón PPP" },
  // Cebolla
  cebolla:     { nombre: "Cebolla sofrita",  art: "cebolla",  color: "#7a4010", cant: "1 Bombón PPP" },
  // Aderezos PRE (6 líneas)
  hot_pre:     { nombre: "Hot & Smokey",     art: "lineas",   color: "#8B2010", cant: "6 líneas" },
  ranch_pre:   { nombre: "Ranch-César",      art: "lineas",   color: "#c8d840", cant: "6 líneas" },
  sweet_pre:   { nombre: "Sweet & Spicy",    art: "lineas",   color: "#d44010", cant: "6 líneas" },
  garlic_pre:  { nombre: "Garlic Parmesan",  art: "lineas",   color: "#e8e060", cant: "6 líneas" },
  cesar_pre:   { nombre: "Aderezo César",    art: "lineas",   color: "#d4d090", cant: "6 líneas" },
  // Aderezos POST (3 líneas)
  ranch_post:  { nombre: "Ranch-César",      art: "lineas",   color: "#c8d840", cant: "3 líneas" },
  sweet_post:  { nombre: "Sweet & Spicy",    art: "lineas",   color: "#d44010", cant: "3 líneas" },
  garlic_post: { nombre: "Garlic Parmesan",  art: "lineas",   color: "#e8e060", cant: "3 líneas" },
  cesar_post:  { nombre: "Aderezo César",    art: "lineas",   color: "#d4d090", cant: "3 líneas" },
  guacamole:   { nombre: "Guacamole",        art: "lineas",   color: "#3a7228", cant: "2 líneas" },
  // Queso
  grandcheese: { nombre: "Grand Cheese",     art: "queso",    color: "#c8a020", cant: "1 Bombón al ras" },
  // Frescos
  lechuga:     { nombre: "Lechuga Romana",   art: "hoja",     color: "#3a6e20", cant: "1 taza azul OCS" },
  cilantro:    { nombre: "Cilantro",         art: "hoja",     color: "#2a7010", cant: "3 dedos" },
  tomate:      { nombre: "Tomate",           art: "rodaja",   color: "#c83030", cant: "3 rodajas" },
  pepino:      { nombre: "Pepino",           art: "rodaja",   color: "#5a9a30", cant: "3 rodajas" },
  aguacate:    { nombre: "Aguacate",         art: "aguacate", color: "#4a8020", cant: "¼ partido en 4" },
};

const PRODUCTOS = {
  MEX: {
    nombre: "Toaster Mexicano", tipo: "toster",
    pre: [
      { slot: "cebolla",     ing: "cebolla",     cant: "1 Bombón PPP" },
      { slot: "pollo",       ing: "pollo",       cant: "1 topping" },
      { slot: "aderezo_pre", ing: "hot_pre",     cant: "6 líneas" },
      { slot: "cheese",      ing: "grandcheese", cant: "1 Bombón al ras" },
    ],
    post: [ { slot: "guacamole", ing: "guacamole", cant: "2 líneas" } ]
  },
  PAR: {
    nombre: "Toaster Pollo Aguacate Ranch", tipo: "toster",
    pre: [
      { slot: "pollo",       ing: "pollo",       cant: "1 topping" },
      { slot: "aderezo_pre", ing: "ranch_pre",   cant: "6 líneas" },
      { slot: "cheese",      ing: "grandcheese", cant: "1 Bombón al ras" },
    ],
    post: [
      { slot: "aderezo_post", ing: "ranch_post", cant: "3 líneas" },
      { slot: "lechuga",      ing: "lechuga",    cant: "1 taza azul OCS" },
      { slot: "tomate",       ing: "tomate",     cant: "3 rodajas" },
      { slot: "pepino",       ing: "pepino",     cant: "3 rodajas" },
      { slot: "aguacate",     ing: "aguacate",   cant: "¼ partido en 4" },
    ]
  },
  PSS: {
    nombre: "Toaster Pollo Sweet & Spicy", tipo: "toster",
    pre: [
      { slot: "pollo",       ing: "pollo",       cant: "1 topping" },
      { slot: "aderezo_pre", ing: "sweet_pre",   cant: "6 líneas" },
      { slot: "tocino",      ing: "tocino",      cant: "½ Bombón PPP" },
      { slot: "cheese",      ing: "grandcheese", cant: "1 Bombón al ras" },
    ],
    post: [
      { slot: "aderezo_post", ing: "sweet_post", cant: "3 líneas" },
      { slot: "lechuga",      ing: "lechuga",    cant: "1 taza azul OCS" },
      { slot: "pepino",       ing: "pepino",     cant: "3 rodajas" },
      { slot: "cilantro",     ing: "cilantro",   cant: "3 dedos" },
    ]
  },
  TUM: {
    nombre: "Toaster Turkey Melt", tipo: "toster",
    pre: [
      { slot: "jamon",       ing: "jamon",       cant: "3 medias lascas" },
      { slot: "aderezo_pre", ing: "garlic_pre",  cant: "6 líneas" },
      { slot: "cheese",      ing: "grandcheese", cant: "1 Bombón rebozado" },
    ],
    post: [
      { slot: "aderezo_post", ing: "garlic_post", cant: "3 líneas" },
      { slot: "tomate",       ing: "tomate",      cant: "3 rebanadas" },
    ]
  },
  PBC: {
    nombre: "Toaster Pollo Bacon Caesar", tipo: "toster",
    pre: [
      { slot: "pollo",       ing: "pollo",       cant: "1 topping" },
      { slot: "aderezo_pre", ing: "cesar_pre",   cant: "6 líneas" },
      { slot: "tocino",      ing: "tocino",      cant: "½ Bombón PPP" },
      { slot: "cheese",      ing: "grandcheese", cant: "1 PPP al ras" },
    ],
    post: [
      { slot: "aderezo_post", ing: "cesar_post", cant: "3 líneas" },
      { slot: "lechuga",      ing: "lechuga",    cant: "1 taza azul OCS" },
      { slot: "tomate",       ing: "tomate",     cant: "3 rodajas" },
    ]
  },
};

const SITUACIONES = [
  // MEXICANO
  { id:"MEX-01", prod:"MEX", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"A", slot:"aderezo_pre", malo:"ranch_pre"} ],
    banco:["hot_pre","guacamole","sweet_pre","cesar_pre"] },
  { id:"MEX-02", prod:"MEX", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"B", slot:"cheese"} ],
    banco:["grandcheese","cebolla","tomate","tocino"] },
  { id:"MEX-03", prod:"MEX", momento:"post", tiempo:18,
    mutaciones:[ {tipo:"B", slot:"guacamole"} ],
    banco:["guacamole","ranch_post","sweet_post"] },
  { id:"MEX-04", prod:"MEX", momento:"pre", tiempo:26,
    mutaciones:[ {tipo:"A", slot:"aderezo_pre", malo:"ranch_pre"}, {tipo:"B", slot:"cheese"} ],
    banco:["hot_pre","grandcheese","tocino","lechuga"] },

  // POLLO AGUACATE RANCH
  { id:"PAR-01", prod:"PAR", momento:"post", tiempo:20,
    mutaciones:[ {tipo:"B", slot:"aguacate"} ],
    banco:["aguacate","cilantro","cebolla","grandcheese"] },
  { id:"PAR-02", prod:"PAR", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"A", slot:"aderezo_pre", malo:"hot_pre"} ],
    banco:["ranch_pre","sweet_pre","cesar_pre","garlic_pre"] },
  { id:"PAR-03", prod:"PAR", momento:"post", tiempo:24,
    mutaciones:[ {tipo:"A", slot:"aderezo_post", malo:"sweet_post"}, {tipo:"B", slot:"lechuga"} ],
    banco:["ranch_post","lechuga","sweet_post","tomate"] },

  // SWEET & SPICY
  { id:"PSS-01", prod:"PSS", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"B", slot:"tocino"} ],
    banco:["tocino","pollo","grandcheese","cebolla"] },
  { id:"PSS-02", prod:"PSS", momento:"post", tiempo:22,
    mutaciones:[ {tipo:"A", slot:"aderezo_post", malo:"ranch_post"}, {tipo:"B", slot:"cilantro"} ],
    banco:["sweet_post","cilantro","lechuga","pepino"] },

  // TURKEY MELT
  { id:"TUM-01", prod:"TUM", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"A", slot:"jamon", malo:"pollo"} ],
    banco:["jamon","pollo","tocino","cebolla"] },
  { id:"TUM-02", prod:"TUM", momento:"post", tiempo:22,
    mutaciones:[ {tipo:"B", slot:"tomate"}, {tipo:"A", slot:"aderezo_post", malo:"cesar_post"} ],
    banco:["tomate","garlic_post","lechuga","pepino"] },

  // BACON CAESAR
  { id:"PBC-01", prod:"PBC", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"B", slot:"tocino"} ],
    banco:["tocino","pollo","grandcheese","cebolla"] },
  { id:"PBC-02", prod:"PBC", momento:"pre", tiempo:20,
    mutaciones:[ {tipo:"A", slot:"aderezo_pre", malo:"ranch_pre"} ],
    banco:["cesar_pre","ranch_pre","sweet_pre","garlic_pre"] },
];

function obtenerRonda(n = 6) {
  return [...SITUACIONES].sort(() => Math.random() - 0.5).slice(0, Math.min(n, SITUACIONES.length));
}
function obtenerSituacion(id) {
  return SITUACIONES.find(s => s.id === id) || null;
}