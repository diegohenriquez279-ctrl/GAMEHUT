/* ============================================================
   PROJECT GAMEHUT — Minijuego 3: "El corte correcto"
   Fábrica de señuelos: cortes-decoys.js
   ------------------------------------------------------------
   Genera por código cortes INCORRECTOS del mismo ingrediente
   (cubos, bastones, rodajas, picado) recoloreando formas con la
   paleta de cada ingrediente. Así no hay que dibujar cada señuelo
   a mano. Se carga DESPUÉS de cortes-svg.js.

   Uso: GameHutSVG.decoy("pepino", "cubos") -> string <svg>...</svg>
        técnicas: cubos | bastones | rodajas | picado | fino |
                  medio | grueso | entero
   ============================================================ */

(function () {
  "use strict";
  if (!window.GameHutSVG) { console.error("cortes-decoys.js: falta cortes-svg.js"); return; }

  /* ---- mismo marco cuadrado que las piezas reales ---- */
  function tileD(inner) {
    return '<svg viewBox="0 0 200 200" class="gh-art" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">'
      + '<rect width="200" height="200" rx="14" fill="url(#gh_wood)"/>'
      + '<ellipse cx="100" cy="84" rx="96" ry="64" fill="url(#gh_glow)"/>'
      + '<g transform="translate(5,4) scale(0.9)">' + inner + '</g></svg>';
  }

  /* ---- paletas por ingrediente ---- */
  const PALETAS = {
    tomate:    { piel:"#cf3a26", carne:"#f47a62", cTop:"#ff7d61", cS1:"#bf311d", cS2:"#e5482e", bFill:"#e23b28", bHi:"#ff8a6b", bLo:"#b22318", picado:["#e23b28","#c9301f","#ff6b52"], semilla:true },
    pepino:    { piel:"#3f7a2e", carne:"#d6e9b8", cTop:"#8fc24a", cS1:"#3f7a2e", cS2:"#5a9e35", bFill:"#6aa83c", bHi:"#cfe89a", bLo:"#37711f", picado:["#4fb33f","#3f9a35","#56b840"], semilla:true },
    zanahoria: { piel:"#c25b10", carne:"#f7b25a", cTop:"#f49232", cS1:"#a64f0d", cS2:"#d06a16", bFill:"#f49232", bHi:"#ffc77e", bLo:"#b9580f", picado:["#f49232","#e0801f","#ffae5a"], semilla:false },
    cebolla:   { piel:"#d9c79a", carne:"#fbf4df", cTop:"#fbf4df", cS1:"#dccb9e", cS2:"#efe6c9", bFill:"#f3ecd0", bHi:"#fffbe8", bLo:"#d2c293", picado:["#fbf4df","#f0e6c8","#fffdf2"], semilla:false },
    apio:      { piel:"#5f8a2c", carne:"#cfe39a", cTop:"#bcd98a", cS1:"#6f9636", cS2:"#9fc24f", bFill:"#a9cf5e", bHi:"#dcecb6", bLo:"#5f7e2c", picado:["#a9cf5e","#8fbf4a","#cfe39a"], semilla:false },
    pollo:     { piel:"#9a5f22", carne:"#eed29a", cTop:"#e0b878", cS1:"#9a5f22", cS2:"#c5842f", bFill:"#dca35a", bHi:"#f1cd8d", bLo:"#9a5f22", picado:["#dca35a","#c5842f","#e8c089"], semilla:false },
    cilantro:  { piel:"#2c6e23", carne:"#cfe3a2", picado:["#4fb33f","#3f9a35","#56b840","#2f7a28"], semilla:false },
    albahaca:  { piel:"#2c6e23", carne:"#cfe3a2", picado:["#3f9a35","#4fb33f","#2f7a28"], semilla:false }
  };

  /* ---- builders de formas ---- */
  function cubo(x, y, rot, sc, p) {
    let s = '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + sc + ')">'
      + '<polygon points="0,-12 12,-5 0,2 -12,-5" fill="' + p.cTop + '"/>'
      + '<polygon points="-12,-5 0,2 0,16 -12,9" fill="' + p.cS1 + '"/>'
      + '<polygon points="12,-5 0,2 0,16 12,9" fill="' + p.cS2 + '"/>';
    if (p.semilla) s += '<ellipse cx="-3" cy="-6" rx="1.4" ry="2" fill="#f4e7b0"/><ellipse cx="3" cy="-4" rx="1.4" ry="2" fill="#f4e7b0"/>';
    return s + '</g>';
  }
  function cubosGen(p) {
    const pos = [[64,70,-8,1],[98,62,6,1.05],[134,72,-4,0.95],[72,104,10,1.1],[108,98,-12,1],[144,108,4,1.05],[90,132,8,0.92],[126,134,-6,1]];
    let s = '<ellipse cx="106" cy="150" rx="74" ry="20" fill="#000000" fill-opacity="0.16"/>';
    pos.forEach(q => s += cubo(q[0], q[1], q[2], q[3], p));
    return s;
  }
  function baston(x, y, rot, p) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ')">'
      + '<rect x="-9" y="-32" width="18" height="64" rx="6" fill="' + p.bFill + '" stroke="' + p.bLo + '" stroke-width="0.6"/>'
      + '<line x1="-3" y1="-28" x2="-3" y2="28" stroke="' + p.bHi + '" stroke-width="2.2" stroke-opacity="0.6" stroke-linecap="round"/>'
      + '<line x1="5" y1="-26" x2="5" y2="26" stroke="' + p.bLo + '" stroke-width="1.4" stroke-opacity="0.5" stroke-linecap="round"/></g>';
  }
  function bastonesGen(p) {
    return '<ellipse cx="105" cy="124" rx="60" ry="12" fill="#000000" fill-opacity="0.18"/>'
      + baston(78, 86, -8, p) + baston(105, 82, 3, p) + baston(132, 88, 11, p);
  }
  function rodaja(x, y, r, p) {
    let s = '<g transform="translate(' + x + ',' + y + ')">'
      + '<ellipse cx="0" cy="' + (r * 0.28).toFixed(1) + '" rx="' + r + '" ry="' + (r * 0.22).toFixed(1) + '" fill="#000000" fill-opacity="0.18"/>'
      + '<circle cx="0" cy="0" r="' + r + '" fill="' + p.carne + '"/>'
      + '<circle cx="0" cy="0" r="' + r + '" fill="none" stroke="' + p.piel + '" stroke-width="5"/>'
      + '<circle cx="0" cy="0" r="' + (r * 0.3).toFixed(1) + '" fill="#ffffff" fill-opacity="0.25"/>';
    if (p.semilla) {
      const d = (r * 0.42).toFixed(1);
      s += '<g fill="#f1e2a0" stroke="#bca24f" stroke-width="0.4">'
        + '<ellipse cx="' + d + '" cy="0" rx="2" ry="2.8"/><ellipse cx="0" cy="' + d + '" rx="2" ry="2.8"/>'
        + '<ellipse cx="-' + d + '" cy="0" rx="2" ry="2.8"/><ellipse cx="0" cy="-' + d + '" rx="2" ry="2.8"/></g>';
    }
    return s + '</g>';
  }
  function rodajasGen(p) {
    return rodaja(86, 80, 34, p) + rodaja(128, 104, 28, p);
  }
  function picadoGen(p, tam) {
    const cols = p.picado;
    let s = '<ellipse cx="105" cy="115" rx="80" ry="44" fill="#000000" fill-opacity="0.1"/>';
    let seed = 7;
    for (let i = 0; i < 46; i++) {
      seed = (seed * 9301 + 49297) % 233280; const rx = seed / 233280;
      const x = 46 + rx * 120;
      seed = (seed * 1103 + 12345) % 233280; const y = 58 + (seed / 233280) * 92;
      const c = cols[i % cols.length];
      const w = tam * (0.8 + (i % 3) * 0.2);
      s += '<rect x="' + (-w / 2).toFixed(1) + '" y="' + (-w * 0.4).toFixed(1) + '" width="' + w.toFixed(1)
        + '" height="' + (w * 0.8).toFixed(1) + '" rx="' + (w * 0.3).toFixed(1) + '" fill="' + c
        + '" transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + ((i * 47) % 360) + ')"/>';
    }
    return s;
  }

  /* ---- API: GameHutSVG.decoy(ingrediente, tecnica) ---- */
  function decoy(ing, tec) {
    if (tec === "entero") return GameHutSVG.obtener("entero_" + ing);
    if (tec === "chiffonade") return GameHutSVG.obtener("corte_" + ing + "_chiffonade");
    const p = PALETAS[ing];
    if (!p) return "";
    let inner = "";
    switch (tec) {
      case "cubos":    inner = cubosGen(p); break;
      case "bastones": inner = bastonesGen(p); break;
      case "rodajas":  inner = rodajasGen(p); break;
      case "fino":     inner = picadoGen(p, 4); break;
      case "picado":
      case "medio":    inner = picadoGen(p, 7); break;
      case "grueso":   inner = picadoGen(p, 11); break;
      default: return "";
    }
    return tileD(inner);
  }

  GameHutSVG.decoy = decoy;
  GameHutSVG.PALETAS = PALETAS;

})();