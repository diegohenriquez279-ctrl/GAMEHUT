/**
 * minijuego-2.js — ¿Falta algo?  (v4)
 * Project GameHut | Pizza Hut El Salvador
 * Depende de: productos.js, scores.js
 *
 * Cambios v4:
 *  - Sopas eliminadas (solo tosters).
 *  - Ingrediente incorrecto se ARRASTRA al basurero para quitarlo.
 *  - Colocación robusta: soltar en cualquier parte del toster busca el
 *    hueco que corresponde al ingrediente. Sin cálculo de coordenadas.
 *  - Guion (—) cuando no hay récord anterior (sin NaN).
 *  - Toster centrado en pantalla, fondo de pared sencillo.
 */
'use strict';

const MJ2_ID = 'minijuego-2';
const RONDAS = 6;
const MIN_OK = 5;

const E = {
  ronda: [], i: 0,
  fixesPend: 0, totalFixes: 0, aciertos: 0, fallos: 0,
  msRonda: 0, tSit: null, tRonda: null,
  tRest: 0, tMax: 0,
  activo: false, mute: false, drag: null
};

const D = {};
function cacheDOM() {
  ['pregame','juego','resultado','btn-comenzar','btn-reintentar',
   'record-pre','hud-producto','hud-momento','hud-timer','hud-timer-stat',
   'hud-errores','enunciado','toster','banco','trash','feedback','drag-ghost',
   'timer-bar','timer-seg',
   'res-record','res-titulo','res-tiempo','res-aciertos','res-anterior','res-mensaje'
  ].forEach(id => D[id] = document.getElementById('mj2-' + id));
}

// ─── AUDIO ───
let AC = null;
const getAC = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function beep(freqs) {
  if (E.mute) return;
  try {
    const c = getAC();
    freqs.forEach(([f, t0, t1]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t1);
      o.start(c.currentTime + t0); o.stop(c.currentTime + t1);
    });
  } catch (e) {}
}
const SFX = {
  ok:   () => beep([[800,0,0.08],[1200,0.05,0.15]]),
  err:  () => beep([[300,0,0.1],[200,0.08,0.2]]),
  tick: () => beep([[900,0,0.04]]),
  win:  () => beep([[523,0,0.12],[659,0.1,0.22],[784,0.2,0.5]]),
};

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  mostrarRecordPre();
  D['btn-comenzar'].addEventListener('click', iniciar);
  D['btn-reintentar'].addEventListener('click', reiniciar);
  initSilencio();
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
});

function mostrarRecordPre() {
  if (typeof getScore !== 'function') return;
  const r = getScore(MJ2_ID);
  if (r && isFinite(r.tiempo) && D['record-pre'])
    D['record-pre'].innerHTML = `Mejor tiempo: <span>${fmt(r.tiempo * 1000)}</span>`;
}

// ═══ FLUJO ═══
function iniciar() {
  E.ronda = obtenerRonda(RONDAS);
  E.i = 0; E.aciertos = 0; E.fallos = 0; E.msRonda = 0;
  mostrarFase('jugando');
  clearInterval(E.tRonda);
  E.tRonda = setInterval(() => E.msRonda += 100, 100);
  cargar(E.ronda[0]);
}
function reiniciar() {
  clearInterval(E.tSit); clearInterval(E.tRonda);
  mostrarRecordPre();
  mostrarFase('pregame');
}
function avanzar() {
  clearInterval(E.tSit);
  E.i++;
  if (E.i >= E.ronda.length) { terminar(); return; }
  setTimeout(() => cargar(E.ronda[E.i]), 1100);
}
function terminar() {
  clearInterval(E.tRonda);
  E.activo = false;
  const ms = E.msRonda;
  let prev = null;
  if (typeof getScore === 'function') prev = getScore(MJ2_ID);
  const prevValido = prev && isFinite(prev.tiempo);
  const prevMs = prevValido ? prev.tiempo * 1000 : null;
  const record = E.aciertos >= MIN_OK && (!prevValido || ms < prevMs);
  if (record && typeof saveScore === 'function') {
    saveScore(MJ2_ID, { tiempo: Math.round(ms / 1000), aciertos: E.aciertos });
    SFX.win();
  }
  setTimeout(() => resultado(ms, record, prevValido ? prev : null), 500);
}

// ═══ CARGAR SITUACIÓN ═══
function cargar(sit) {
  const prod = PRODUCTOS[sit.prod];
  const { capas, cocidas, fixes } = construir(sit, prod);
  const nombreProd = prod.nombre.replace(/Toaster/g, 'Toster');

  E.totalFixes = fixes;
  E.fixesPend = fixes;
  E.activo = true;
  E.tMax = sit.tiempo;
  E.tRest = sit.tiempo;

  D['hud-producto'].textContent = nombreProd;
  D['hud-momento'].textContent  = lblMomento(sit.momento);
  D['hud-timer'].textContent    = sit.tiempo;
  D['hud-timer-stat'].className  = 'mj2-stat mj2-stat--verde';
  D['hud-errores'].textContent  = `${E.i + 1} / ${E.ronda.length}`;
  D['enunciado'].innerHTML =
    `${nombreProd} &mdash; <strong>${lblMomento(sit.momento) || 'revisa bien'}</strong>`;
  D['timer-bar'].style.width = '100%';
  D['timer-bar'].className = 'mj2-timer-bar verde';
  D['timer-seg'].textContent = sit.tiempo + 's';
  D['timer-seg'].className = 'mj2-timer-seg verde';

  renderToster(capas, cocidas);
  renderBanco(sit);
  setFB('info', 'Revisa bien el toster — algo está mal o falta');

  clearInterval(E.tSit);
  E.tSit = setInterval(tick, 1000);
}

const lblMomento = m => m === 'pre' ? 'antes de cocinar' : m === 'post' ? 'después de cocinar' : '';

function construir(sit, prod) {
  const base = sit.momento === 'post' ? prod.post : prod.pre;
  let capas = base.map(c => ({ slot: c.slot, ing: c.ing, cant: c.cant, estado: 'ok', need: null }));

  let cocidas = [];
  if (sit.momento === 'post' && prod.pre)
    cocidas = prod.pre.map(c => ({ slot: c.slot, ing: c.ing, cant: c.cant, estado: 'cocido' }));

  let fixes = 0;
  sit.mutaciones.forEach(m => {
    const idx = capas.findIndex(c => c.slot === m.slot);
    if (idx < 0) return;
    if (m.tipo === 'B') {
      capas[idx] = { slot: m.slot, ing: null, cant: '', estado: 'slot', need: base[idx].ing };
      fixes++;
    } else if (m.tipo === 'A') {
      capas[idx] = { slot: m.slot, ing: m.malo, cant: INGREDIENTES[m.malo].cant, estado: 'error', need: base[idx].ing };
      fixes++;
    } else if (m.tipo === 'C') {
      capas[idx] = { slot: m.slot, ing: base[idx].ing, cant: m.cantMala, estado: 'error', need: base[idx].ing };
      fixes++;
    }
  });
  return { capas, cocidas, fixes };
}

// ═══ TIMER ═══
function tick() {
  if (!E.activo) return;
  E.tRest--;
  D['hud-timer'].textContent = E.tRest;
  const r = E.tRest / E.tMax;
  let color;
  if (r > 0.5)       { D['hud-timer-stat'].className = 'mj2-stat mj2-stat--verde';    color = 'verde'; }
  else if (r > 0.25) { D['hud-timer-stat'].className = 'mj2-stat mj2-stat--amarillo'; color = 'amarillo'; }
  else { D['hud-timer-stat'].className = 'mj2-stat mj2-stat--rojo'; color = 'rojo'; SFX.tick(); }
  D['timer-bar'].style.width = Math.max(0, r * 100) + '%';
  D['timer-bar'].className = 'mj2-timer-bar ' + color;
  D['timer-seg'].textContent = Math.max(0, E.tRest) + 's';
  D['timer-seg'].className = 'mj2-timer-seg ' + color;
  if (E.tRest <= 0) {
    clearInterval(E.tSit); E.activo = false; E.fallos++;
    SFX.err(); setFB('error', '¡Tiempo! Pasa a la siguiente.');
    setTimeout(() => transicionSalida(avanzar), 1400);
  }
}

// Animación de salida/entrada entre tosters
function transicionSalida(cb) {
  const stack = D['toster'];
  stack.classList.remove('mj2-anim-in');
  // forzar reflow para reiniciar cualquier animación previa
  void stack.offsetWidth;
  stack.classList.add('mj2-anim-out');
  setTimeout(() => {
    // ocultar el toster viejo ANTES de renderizar el nuevo, para evitar parpadeo
    stack.style.visibility = 'hidden';
    stack.classList.remove('mj2-anim-out');
    if (cb) cb();
  }, 420);
}

// ═══ RENDER TOSTER ═══
function renderToster(capas, cocidas) {
  const stack = D['toster'];
  stack.className = 'mj2-toster';
  stack.innerHTML = '';
  stack.style.visibility = 'visible';
  // reiniciar animación de entrada desde cero (evita pisarse con la de salida)
  void stack.offsetWidth;
  stack.classList.add('mj2-anim-in');
  stack.appendChild(capaTortilla('base'));
  if (cocidas.length) {
    cocidas.forEach((c, k) => stack.appendChild(capaEl(c, k, true)));
    stack.appendChild(sepCocido());
  }
  capas.forEach((c, k) => stack.appendChild(capaEl(c, k, false)));
  stack.appendChild(capaTortilla('tapa'));
}

function capaTortilla(cual) {
  const el = document.createElement('div');
  el.className = 'mj2-capa mj2-capa--tortilla';
  el.innerHTML = artSVG('tortilla', '#dbb860');
  addLbl(el, cual === 'base' ? 'Base tortilla' : 'Tapa tortilla', 'der', 'ok');
  return el;
}
function sepCocido() {
  const el = document.createElement('div');
  el.className = 'mj2-sep-cocido';
  el.textContent = '── ya cocinado ──';
  return el;
}

function capaEl(capa, idx, esCocido) {
  const el = document.createElement('div');
  el.className = 'mj2-capa';
  if (esCocido) el.classList.add('mj2-capa--cocido');
  const lado = idx % 2 === 0 ? 'izq' : 'der';

  if (capa.estado === 'slot') {
    el.classList.add('mj2-capa--slot');
    el.dataset.need = capa.need;
    el.innerHTML = '<div class="mj2-slot-marca"></div>';
    addLbl(el, '? falta algo', lado, 'falta');
    return el;
  }

  const def = INGREDIENTES[capa.ing] || { nombre: capa.ing, art: 'queso', color: '#888' };
  el.innerHTML = artSVG(def.art, def.color);

  if (capa.estado === 'error' && !esCocido) {
    el.classList.add('mj2-capa--error');
    el.dataset.need = capa.need;
    el.dataset.nombre = def.nombre;
    addLbl(el, '✗ ' + def.nombre, lado, 'error');
    el.addEventListener('pointerdown', e => onCapaDown(e, el));
  } else {
    addLbl(el, def.nombre, lado, esCocido ? 'cocido' : 'ok');
  }
  return el;
}

function addLbl(el, texto, lado, tipo) {
  const lbl = document.createElement('span');
  lbl.className = `mj2-capa-lbl mj2-capa-lbl--${lado} mj2-capa-lbl--${tipo}`;
  lbl.textContent = texto;
  el.appendChild(lbl);
}

// ═══ BANCO ═══
function renderBanco(sit) {
  D['banco'].innerHTML = '<div class="mj2-banco-title">Ingredientes</div>';
  sit.banco.forEach(ingKey => {
    const def = INGREDIENTES[ingKey];
    if (!def) return;
    const card = document.createElement('div');
    card.className = 'mj2-ing-card';
    card.dataset.id = ingKey;
    card.innerHTML = artSVG(def.art, def.color, 'card');
    card.insertAdjacentHTML('beforeend',
      `<div class="mj2-ing-lbl">${def.nombre}</div><div class="mj2-ing-sub">${def.cant || ''}</div>`);
    card.addEventListener('pointerdown', e => onBankDown(e, card, ingKey));
    D['banco'].appendChild(card);
  });
}

// ═══ ARRASTRE UNIFICADO (Pointer Events) ═══
function onBankDown(e, card, ingKey) {
  if (!E.activo) return;
  e.preventDefault();
  E.drag = { kind: 'bank', id: ingKey, el: card };
  card.classList.add('is-dragging');
  showGhost(INGREDIENTES[ingKey].nombre, e.clientX, e.clientY);
}

function onCapaDown(e, el) {
  if (!E.activo || !el.classList.contains('mj2-capa--error')) return;
  e.preventDefault();
  E.drag = { kind: 'capa', need: el.dataset.need, el };
  el.classList.add('is-dragging');
  showGhost('Quitar: ' + (el.dataset.nombre || 'ingrediente'), e.clientX, e.clientY);
}

function onPointerMove(e) {
  if (!E.drag) return;
  moveGhost(e.clientX, e.clientY);
  // resaltar basurero si arrastramos una capa de error sobre él
  if (E.drag.kind === 'capa') {
    const bajo = document.elementFromPoint(e.clientX, e.clientY);
    D['trash'].classList.toggle('activo', !!(bajo && bajo.closest('#mj2-trash')));
  }
}

function onPointerUp(e) {
  if (!E.drag) return;
  const drag = E.drag;
  E.drag = null;
  hideGhost();
  drag.el.classList.remove('is-dragging');
  D['trash'].classList.remove('activo');

  const bajo = document.elementFromPoint(e.clientX, e.clientY);

  if (drag.kind === 'capa') {
    // ¿Soltó sobre el basurero?
    if (bajo && bajo.closest('#mj2-trash')) {
      convertirErrorEnHueco(drag.el);
      SFX.ok();
      setFB('ok', 'Quitaste el ingrediente incorrecto. Ahora coloca el correcto.');
    }
    return;
  }

  // kind === 'bank'
  const dentroToster = bajo && bajo.closest('#mj2-toster');
  if (!dentroToster) return; // soltó fuera del toster: sin efecto

  const id = drag.id;
  const slots = [...D['toster'].querySelectorAll('.mj2-capa--slot')];
  const slotMatch = slots.find(s => s.dataset.need === id);

  if (slotMatch) {
    llenarHueco(slotMatch, id);
    drag.el.classList.add('is-used');
    SFX.ok();
    E.fixesPend--;
    if (E.fixesPend <= 0) {
      // Toster completo: detener timer de inmediato y pasar con animación
      clearInterval(E.tSit);
      E.activo = false;
      E.aciertos++;
      SFX.win();
      setFB('ok', '¡Muy bien! Toster correcto. Siguiente...');
      transicionSalida(() => avanzar());
    } else {
      setFB('ok', `¡Correcto! ${INGREDIENTES[id].nombre} va aquí. Sigue revisando.`);
    }
  } else {
    // ¿es correcto pero todavía hay un incorrecto sin quitar?
    const errores = [...D['toster'].querySelectorAll('.mj2-capa--error')];
    if (errores.some(c => c.dataset.need === id)) {
      setFB('error', 'Primero arrastra el ingrediente incorrecto al basurero.');
    } else {
      shake(drag.el);
      SFX.err();
      setFB('error', 'Ese ingrediente no va en este toster. Sigue revisando.');
      setTimeout(() => { if (E.activo) setFB('info', 'Revisa bien el toster'); }, 2200);
    }
  }
}

function convertirErrorEnHueco(el) {
  el.classList.remove('mj2-capa--error');
  el.classList.add('mj2-capa--slot');
  el.innerHTML = '<div class="mj2-slot-marca"></div>';
  addLbl(el, '? coloca el correcto', 'der', 'falta');
}

function llenarHueco(slot, ingKey) {
  const def = INGREDIENTES[ingKey];
  slot.className = 'mj2-capa mj2-capa--rellenado';
  slot.innerHTML = artSVG(def.art, def.color);
  addLbl(slot, def.nombre, 'der', 'ok');
}

function showGhost(txt, x, y) { D['drag-ghost'].textContent = txt; D['drag-ghost'].style.display = 'block'; moveGhost(x, y); }
function moveGhost(x, y) { D['drag-ghost'].style.left = x + 'px'; D['drag-ghost'].style.top = y + 'px'; }
function hideGhost() { D['drag-ghost'].style.display = 'none'; }
function shake(el) { el.classList.add('anim-err'); setTimeout(() => el.classList.remove('anim-err'), 380); }

// ═══ RESULTADO ═══
function resultado(ms, record, prev) {
  mostrarFase('resultado');
  D['res-record'].classList.toggle('visible', record);
  const ex = E.aciertos >= Math.ceil(RONDAS * 0.8);
  D['res-titulo'].textContent = ex ? '¡Excelente!' : E.aciertos >= MIN_OK ? '¡Bien hecho!' : 'Sigue practicando';
  D['res-tiempo'].textContent   = fmt(ms);
  D['res-aciertos'].textContent = `${E.aciertos}/${RONDAS}`;
  D['res-anterior'].textContent = prev ? fmt(prev.tiempo * 1000) : '—';
  if (D['res-mensaje']) {
    const alcanzoMinimo = E.aciertos >= MIN_OK;
    D['res-mensaje'].classList.toggle('oculto', alcanzoMinimo);
    D['res-mensaje'].textContent = alcanzoMinimo ? '' : `Necesitas al menos ${MIN_OK} de ${RONDAS} tosters para registrar récord. ¡Inténtalo de nuevo!`;
  }
  const caja = D['res-tiempo'].closest('.mj2-stat-box');
  if (caja) {
    caja.classList.remove('mj2-stat-box--verde', 'mj2-stat-box--rojo');
    if (ms < 60000)       caja.classList.add('mj2-stat-box--verde');
    else if (ms > 120000) caja.classList.add('mj2-stat-box--rojo');
  }
}

// ═══ UTILIDADES ═══
function mostrarFase(f) {
  D['pregame'].classList.toggle('oculto',   f !== 'pregame');
  D['juego'].classList.toggle('oculto',     f !== 'jugando');
  D['resultado'].classList.toggle('oculto', f !== 'resultado');
}
function setFB(t, txt) { D['feedback'].className = `mj2-feedback mj2-feedback--${t}`; D['feedback'].textContent = txt; }
function fmt(ms) {
  if (ms == null || !isFinite(ms)) return '—';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), sg = s % 60;
  return m > 0 ? `${m}m ${sg}s` : `${sg}s`;
}
function initSilencio() {
  const btns = document.querySelectorAll('.mj2-btn-silencio');
  if (localStorage.getItem('gamehut-silencio') === 'true') E.mute = true;
  btns.forEach(b => {
    b.textContent = E.mute ? '🔇' : '🔊';
    b.addEventListener('click', () => {
      E.mute = !E.mute;
      btns.forEach(x => x.textContent = E.mute ? '🔇' : '🔊');
      localStorage.setItem('gamehut-silencio', E.mute);
    });
  });
}

// ═══ ARTE SVG ═══
function artSVG(art, color, modo = '') {
  const W = modo === 'card' ? 72 : 240;
  const H = modo === 'card' ? 26 : 26;
  const cx = W / 2, cy = H / 2;
  const dark = shade(color, -25), light = shade(color, 25);
  let inner = '';
  switch (art) {
    case 'tortilla':
      inner = `<ellipse cx="${cx}" cy="${cy}" rx="${cx-4}" ry="${H/2-2}" fill="#dbb860" stroke="#b88830" stroke-width="0.8"/>
               <line x1="6" y1="${cy}" x2="${W-6}" y2="${cy}" stroke="#a07828" stroke-width="1.5" opacity="0.6"/>`; break;
    case 'lineas': {
      const ys = modo ? [cy-4, cy, cy+4] : [cy-5, cy-1, cy+3];
      const gs = modo ? [4,3,2] : [5,3.5,2.5];
      inner = ys.map((y,i)=>`<path d="M6 ${y} Q${cx/2} ${y-5} ${cx} ${y-3} Q${cx*1.5} ${y-5} ${W-6} ${y}" fill="none" stroke="${color}" stroke-width="${gs[i]}" stroke-linecap="round" opacity="${0.85-i*0.15}"/>`).join(''); break;
    }
    case 'trocitos': {
      const n = modo ? 4 : 8;
      for (let i=0;i<n;i++){ const x=(W/(n+1))*(i+1); const r=(i%2)+(modo?4:8);
        inner += `<ellipse cx="${x}" cy="${cy}" rx="${r}" ry="${modo?4:5}" fill="${color}" stroke="${dark}" stroke-width="0.5" transform="rotate(${(i%2?10:-10)} ${x} ${cy})"/>`; } break;
    }
    case 'cebolla': {
      const n = modo ? 4 : 8;
      for (let i=0;i<n;i++){ const x=(W/(n+1))*(i+1);
        inner += `<ellipse cx="${x}" cy="${cy}" rx="${modo?5:9}" ry="${modo?3:4.5}" fill="#7a4010" stroke="#a85818" stroke-width="1"/><ellipse cx="${x}" cy="${cy-1}" rx="${modo?2:3}" ry="1" fill="#c07828" opacity="0.4"/>`; } break;
    }
    case 'queso':
      inner = `<ellipse cx="${cx}" cy="${cy}" rx="${cx-6}" ry="${H/2-2}" fill="${color}" stroke="${dark}" stroke-width="0.5"/>`;
      for (let i=0;i<(modo?3:5);i++){ const x=(W/(modo?4:6))*(i+1);
        inner += `<ellipse cx="${x}" cy="${cy-1}" rx="${modo?4:8}" ry="2" fill="${light}" opacity="0.45"/>`; } break;
    case 'hoja':
      inner = `<path d="M6 ${cy} Q${cx} ${cy-H/2+1} ${W-6} ${cy} Q${cx} ${cy+H/2-1} 6 ${cy} Z" fill="${color}" stroke="${dark}" stroke-width="0.5"/><line x1="10" y1="${cy}" x2="${W-10}" y2="${cy}" stroke="${light}" stroke-width="0.7" opacity="0.5"/>`; break;
    case 'rodaja': {
      const ep = (color.indexOf('9a')>=0 || color.indexOf('5a')>=0);
      inner = `<ellipse cx="${cx}" cy="${cy}" rx="${cx-6}" ry="${H/2-2}" fill="${color}" stroke="${dark}" stroke-width="${ep?1.5:0.8}"/><ellipse cx="${cx}" cy="${cy}" rx="${cx-14}" ry="${H/2-4}" fill="${light}" opacity="0.4"/>`;
      [-12,0,12].forEach(dx=> inner += `<ellipse cx="${cx+dx}" cy="${cy}" rx="2.2" ry="1.3" fill="${ep?'#e8f0c0':'#f0f0d0'}" opacity="0.75"/>`); break;
    }
    case 'tocino': {
      const n = modo ? 3 : 5;
      for (let i=0;i<n;i++){ const x=(W/(n+1))*(i+1)-(modo?5:13);
        inner += `<rect x="${x}" y="${cy-5}" width="${modo?10:26}" height="10" rx="2" fill="#8a2010"/><rect x="${x+2}" y="${cy-2}" width="${modo?6:22}" height="3" rx="1" fill="#e8c0a0" opacity="0.5"/>`; } break;
    }
    case 'aguacate': {
      const n = modo ? 2 : 4;
      for (let i=0;i<n;i++){ const x=(W/(n+1))*(i+1);
        inner += `<ellipse cx="${x}" cy="${cy}" rx="${modo?12:14}" ry="8" fill="${color}" stroke="#2a6010" stroke-width="0.8"/><ellipse cx="${x}" cy="${cy}" rx="${modo?7:8}" ry="4" fill="#7aba30" opacity="0.5"/>`; } break;
    }
    default:
      inner = `<rect x="4" y="4" width="${W-8}" height="${H-8}" rx="4" fill="${color}" opacity="0.8"/>`;
  }
  return `<svg class="mj2-art" viewBox="0 0 ${W} ${H}" width="${modo==='card'?72:'100%'}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function shade(hex, d) {
  try {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    const c=v=>Math.max(0,Math.min(255,v+d));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  } catch(e){ return hex; }
}