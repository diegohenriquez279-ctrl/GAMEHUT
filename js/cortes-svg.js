/* ============================================================
   PROJECT GAMEHUT — Minijuego 3: "El corte correcto"
   Biblioteca SVG: cortes-svg.js
   ------------------------------------------------------------
   Contiene el arte aprobado (8 enteros + 9 cortes) como SVG
   reutilizable. Cada pieza es un <svg> cuadrado (200x200) con la
   tabla de fondo y SIN etiquetas (el juego pone los textos).

   USO:
     1) Una sola vez al cargar la página:  GameHutSVG.inyectarDefs();
     2) Para obtener una pieza:             GameHutSVG.obtener("entero_tomate")
        -> devuelve un string <svg>...</svg> listo para innerHTML.

   Los defs (gradientes y símbolos) se inyectan UNA vez en un <svg>
   oculto del documento; cada pieza los referencia por id. Así no se
   duplican y los ids no chocan.
   ============================================================ */

(function (global) {

  /* ---------- DEFS COMPARTIDOS (gradientes + símbolos) ---------- */
  const DEFS = `
  <defs>
    <linearGradient id="gh_wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d3a86b"/><stop offset="1" stop-color="#956331"/>
    </linearGradient>
    <radialGradient id="gh_glow" cx="0.42" cy="0.30" r="0.62">
      <stop offset="0" stop-color="#fff3da" stop-opacity="0.55"/><stop offset="1" stop-color="#fff3da" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gh_tomBody" cx="0.36" cy="0.30" r="0.78">
      <stop offset="0" stop-color="#ff8a6b"/><stop offset="0.55" stop-color="#e6402c"/><stop offset="1" stop-color="#b22318"/>
    </radialGradient>
    <radialGradient id="gh_tomFlesh" cx="0.5" cy="0.5" r="0.55">
      <stop offset="0" stop-color="#ffd2c5"/><stop offset="0.6" stop-color="#f47a62"/><stop offset="1" stop-color="#d94e38"/>
    </radialGradient>
    <linearGradient id="gh_cuke" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6aa83c"/><stop offset="1" stop-color="#37711f"/>
    </linearGradient>
    <radialGradient id="gh_cukeFlesh" cx="0.5" cy="0.5" r="0.55">
      <stop offset="0" stop-color="#eef6d6"/><stop offset="0.7" stop-color="#cfe3a2"/><stop offset="1" stop-color="#aacb78"/>
    </radialGradient>
    <radialGradient id="gh_basil" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#62b246"/><stop offset="0.6" stop-color="#3f8f34"/><stop offset="1" stop-color="#2c6e23"/>
    </radialGradient>
    <radialGradient id="gh_onion" cx="0.4" cy="0.34" r="0.72">
      <stop offset="0" stop-color="#f3e6ba"/><stop offset="0.6" stop-color="#dcc488"/><stop offset="1" stop-color="#b89a55"/>
    </radialGradient>
    <linearGradient id="gh_carrot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f49232"/><stop offset="1" stop-color="#c25b10"/>
    </linearGradient>
    <linearGradient id="gh_celery" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a9cf5e"/><stop offset="1" stop-color="#7aa23a"/>
    </linearGradient>
    <linearGradient id="gh_front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a4d05c"/><stop offset="0.55" stop-color="#cbe09a"/><stop offset="1" stop-color="#eef2d8"/>
    </linearGradient>
    <linearGradient id="gh_mid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#84b347"/><stop offset="0.55" stop-color="#b3d184"/><stop offset="1" stop-color="#e2e8c8"/>
    </linearGradient>
    <linearGradient id="gh_back" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a9a3a"/><stop offset="0.5" stop-color="#97bb6a"/><stop offset="1" stop-color="#cdd6ab"/>
    </linearGradient>
    <radialGradient id="gh_meat" cx="0.4" cy="0.28" r="0.88">
      <stop offset="0" stop-color="#f0c880"/><stop offset="0.55" stop-color="#cd8c36"/><stop offset="1" stop-color="#955a1b"/>
    </radialGradient>
    <linearGradient id="gh_paleFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#efdcb4"/><stop offset="1" stop-color="#cfac66"/>
    </linearGradient>

    <symbol id="gh_cube" viewBox="-14 -14 28 32">
      <polygon points="0,-12 12,-5 0,2 -12,-5" fill="#ff7d61"/>
      <polygon points="-12,-5 0,2 0,16 -12,9" fill="#bf311d"/>
      <polygon points="12,-5 0,2 0,16 12,9" fill="#e5482e"/>
      <polygon points="0,-12 12,-5 0,2 -12,-5" fill="none" stroke="#a8281a" stroke-width="0.6" stroke-opacity="0.5"/>
      <ellipse cx="-3.5" cy="-6" rx="1.5" ry="2.1" fill="#f4e7b0" stroke="#c9b56a" stroke-width="0.3"/>
      <ellipse cx="3" cy="-4.5" rx="1.5" ry="2.1" fill="#f4e7b0" stroke="#c9b56a" stroke-width="0.3"/>
      <ellipse cx="-0.5" cy="-8.5" rx="1.4" ry="2" fill="#f4e7b0" stroke="#c9b56a" stroke-width="0.3"/>
    </symbol>
    <symbol id="gh_onionbit" viewBox="-5 -3 10 6">
      <rect x="-4" y="-2" width="8" height="4" rx="1.8" fill="#fbf4df" stroke="#e3d09c" stroke-width="0.5"/>
    </symbol>
    <g id="gh_leaf">
      <path d="M0 -17 C9 -15 12 -4 8 5 C5 12 0 17 0 17 C0 17 -5 12 -8 5 C-12 -4 -9 -15 0 -17 Z" fill="url(#gh_basil)" stroke="#2c6e23" stroke-width="0.5"/>
      <path d="M0 -14 L0 14" stroke="#296824" stroke-width="0.9" stroke-opacity="0.55"/>
      <g stroke="#347e2b" stroke-width="0.5" stroke-opacity="0.5">
        <path d="M0 -8 L5 -10"/><path d="M0 -8 L-5 -10"/><path d="M0 0 L6 -2"/><path d="M0 0 L-6 -2"/><path d="M0 7 L4 6"/><path d="M0 7 L-4 6"/>
      </g>
      <ellipse cx="-3" cy="-7" rx="3" ry="5" fill="#76c054" fill-opacity="0.4"/>
    </g>
    <g id="gh_cukeSlice">
      <ellipse cx="0" cy="10" rx="34" ry="8" fill="#2f6a22"/>
      <circle cx="0" cy="0" r="34" fill="url(#gh_cukeFlesh)"/>
      <circle cx="0" cy="0" r="34" fill="none" stroke="#3f7a2e" stroke-width="5"/>
      <circle cx="0" cy="0" r="29" fill="none" stroke="#7fae4e" stroke-width="2"/>
      <circle cx="0" cy="0" r="11" fill="#e8f3cf" fill-opacity="0.7"/>
      <g fill="#f1f7da" stroke="#b6cf86" stroke-width="0.4">
        <ellipse cx="0" cy="-10" rx="2" ry="2.9"/><ellipse cx="9" cy="-5" rx="2" ry="2.9"/><ellipse cx="9" cy="5" rx="2" ry="2.9"/>
        <ellipse cx="0" cy="10" rx="2" ry="2.9"/><ellipse cx="-9" cy="5" rx="2" ry="2.9"/><ellipse cx="-9" cy="-5" rx="2" ry="2.9"/>
      </g>
    </g>
    <g id="gh_frond">
      <path d="M0 0 C-1 -7 0 -14 0 -20" fill="none" stroke="#2f7a2a" stroke-width="1.1" stroke-linecap="round"/>
      <g stroke="#37852e" stroke-width="0.7" stroke-linecap="round" fill="none">
        <path d="M0 -3 L-4 -6"/><path d="M0 -3 L4 -6"/><path d="M0 -6 L-5 -10"/><path d="M0 -6 L5 -10"/>
        <path d="M0 -10 L-4 -14"/><path d="M0 -10 L4 -14"/><path d="M0 -13 L-3 -17"/><path d="M0 -13 L3 -17"/>
        <path d="M0 -16 L-2 -19"/><path d="M0 -16 L2 -19"/>
      </g>
    </g>
    <g id="gh_cLeaf">
      <path d="M0 0 C-3 -3 -7 -2 -8 -6 C-9 -10 -6 -13 -2 -12 C-3 -15 0 -17 0 -17 C0 -17 3 -15 2 -12 C6 -13 9 -10 8 -6 C7 -2 3 -3 0 0 Z" fill="#4aa03c" stroke="#256a20" stroke-width="0.5"/>
      <path d="M0 -2 L0 -14" stroke="#256a20" stroke-width="0.6" stroke-opacity="0.6"/>
    </g>
    <g id="gh_cClus">
      <use href="#gh_cLeaf" transform="rotate(-24) scale(0.95)"/>
      <use href="#gh_cLeaf" transform="rotate(-2) scale(1.1)"/>
      <use href="#gh_cLeaf" transform="rotate(22) scale(0.95)"/>
    </g>
    <g id="gh_carrotBaton">
      <rect x="-9" y="-32" width="18" height="64" rx="6" fill="url(#gh_carrot)" stroke="#a64f0d" stroke-width="0.6"/>
      <line x1="-3" y1="-28" x2="-3" y2="28" stroke="#ffc77e" stroke-width="2.2" stroke-opacity="0.6" stroke-linecap="round"/>
      <line x1="5" y1="-26" x2="5" y2="26" stroke="#b9580f" stroke-width="1.4" stroke-opacity="0.5" stroke-linecap="round"/>
    </g>
    <g id="gh_celeryBaton">
      <rect x="-9" y="-32" width="18" height="64" rx="6" fill="url(#gh_celery)" stroke="#5f7e2c" stroke-width="0.6"/>
      <path d="M-9 -28 Q0 -24 9 -28 L9 32 Q0 28 -9 32 Z" fill="#cfe39a" fill-opacity="0.45"/>
      <line x1="-3" y1="-28" x2="-3" y2="28" stroke="#9fc24f" stroke-width="1" stroke-opacity="0.6"/>
      <line x1="3" y1="-28" x2="3" y2="28" stroke="#6f9636" stroke-width="1" stroke-opacity="0.5"/>
    </g>
  </defs>`;

  /* ---------- HELPER: arma una pieza dentro del marco cuadrado ---------- */
  function tile(inner, transform) {
    return '<svg viewBox="0 0 200 200" class="gh-art" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">'
      + '<rect width="200" height="200" rx="14" fill="url(#gh_wood)"/>'
      + '<ellipse cx="100" cy="84" rx="96" ry="64" fill="url(#gh_glow)"/>'
      + '<g transform="' + transform + '">' + inner + '</g></svg>';
  }
  const T210 = "translate(5,4) scale(0.9)";   // piezas dibujadas en tile ~210
  const THERO = "translate(2,16) scale(0.52)"; // piezas dibujadas en hero 380

  /* ---------- ARTE: ENTEROS ---------- */
  const ART = {};

  ART.entero_tomate = tile(`
    <ellipse cx="106" cy="156" rx="58" ry="13" fill="#000000" fill-opacity="0.26"/>
    <ellipse cx="106" cy="98" rx="58" ry="52" fill="url(#gh_tomBody)"/>
    <path d="M70 60 Q106 50 142 60" fill="none" stroke="#9c2417" stroke-width="2" stroke-opacity="0.25"/>
    <path d="M62 100 Q106 116 150 100" fill="none" stroke="#9c2417" stroke-width="2" stroke-opacity="0.2"/>
    <ellipse cx="86" cy="78" rx="20" ry="12" fill="#ffffff" fill-opacity="0.32"/>
    <g transform="translate(106,52)">
      <path d="M0,-2 L-9,-12 L-2,-8 Z" fill="#3f8f34"/><path d="M0,-2 L9,-12 L2,-8 Z" fill="#357a2b"/>
      <path d="M0,-2 L-13,-3 L-4,-1 Z" fill="#46993a"/><path d="M0,-2 L13,-3 L4,-1 Z" fill="#3a8430"/>
      <path d="M0,-2 L0,-15 L3,-7 Z" fill="#4aa03d"/><rect x="-2" y="-7" width="4" height="8" rx="2" fill="#2f7026"/>
    </g>`, "translate(6,2) scale(0.9)");

  ART.entero_pepino = tile(`
    <ellipse cx="105" cy="128" rx="72" ry="12" fill="#000000" fill-opacity="0.22"/>
    <path d="M40 92 Q40 68 68 66 L142 66 Q170 68 170 92 Q170 116 142 118 L68 118 Q40 116 40 92 Z" fill="url(#gh_cuke)"/>
    <g stroke="#2f6a22" stroke-width="1" stroke-opacity="0.4"><path d="M52 78 Q105 74 158 78"/><path d="M50 104 Q105 108 160 104"/></g>
    <path d="M52 76 Q105 70 158 76" fill="none" stroke="#cfe89a" stroke-width="4" stroke-opacity="0.4" stroke-linecap="round"/>
    <g fill="#2f6a22" fill-opacity="0.4"><circle cx="74" cy="88" r="1.6"/><circle cx="100" cy="98" r="1.6"/><circle cx="126" cy="86" r="1.6"/><circle cx="148" cy="100" r="1.4"/><circle cx="88" cy="104" r="1.4"/></g>`, T210);

  ART.entero_cilantro = tile(`
    <ellipse cx="105" cy="146" rx="40" ry="10" fill="#000000" fill-opacity="0.2"/>
    <path d="M105 148 C103 110 101 80 100 56" fill="none" stroke="#2f6e24" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M105 130 C95 122 86 120 80 118 M105 120 C115 112 124 110 130 108 M105 104 C96 96 88 94 82 92 M105 96 C114 88 122 86 128 84" fill="none" stroke="#2f6e24" stroke-width="2" stroke-linecap="round"/>
    <use href="#gh_leaf" transform="translate(78,112) rotate(-50) scale(0.9)"/>
    <use href="#gh_leaf" transform="translate(132,102) rotate(50) scale(0.95)"/>
    <use href="#gh_leaf" transform="translate(80,86) rotate(-46) scale(0.85)"/>
    <use href="#gh_leaf" transform="translate(128,78) rotate(44) scale(0.9)"/>
    <use href="#gh_leaf" transform="translate(104,62) rotate(-4) scale(1.0)"/>
    <use href="#gh_leaf" transform="translate(105,90) rotate(8) scale(0.8)"/>`, T210);

  ART.entero_cebolla = tile(`
    <ellipse cx="105" cy="156" rx="56" ry="14" fill="#000000" fill-opacity="0.24"/>
    <g stroke="#9a7b3a" stroke-width="2" stroke-linecap="round"><line x1="105" y1="50" x2="100" y2="40"/><line x1="105" y1="50" x2="105" y2="38"/><line x1="105" y1="50" x2="112" y2="41"/></g>
    <ellipse cx="105" cy="100" rx="50" ry="54" fill="url(#gh_onion)"/>
    <g stroke="#a98a4a" stroke-width="1.1" fill="none" stroke-opacity="0.5">
      <path d="M105 50 C84 70 84 132 100 150"/><path d="M105 50 C96 72 94 130 104 150"/><path d="M105 50 C116 72 118 130 108 150"/>
      <path d="M105 50 C128 70 128 132 112 150"/><path d="M70 70 C62 96 64 124 80 144"/><path d="M142 70 C150 96 148 124 132 144"/>
    </g>
    <ellipse cx="88" cy="80" rx="18" ry="22" fill="#fff7df" fill-opacity="0.4"/>
    <g stroke="#cbb27a" stroke-width="1.5" stroke-linecap="round"><line x1="100" y1="152" x2="98" y2="162"/><line x1="106" y1="153" x2="106" y2="164"/><line x1="112" y1="152" x2="114" y2="162"/></g>`, "translate(6,2) scale(0.9)");

  ART.entero_albahaca = tile(`
    <ellipse cx="105" cy="120" rx="74" ry="34" fill="#000000" fill-opacity="0.12"/>
    <use href="#gh_leaf" transform="translate(72,86) rotate(-24) scale(1.3)"/>
    <use href="#gh_leaf" transform="translate(120,78) rotate(18) scale(1.5)"/>
    <use href="#gh_leaf" transform="translate(96,116) rotate(-8) scale(1.6)"/>
    <use href="#gh_leaf" transform="translate(140,116) rotate(34) scale(1.25)"/>`, T210);

  ART.entero_pollo = tile(`
    <ellipse cx="196" cy="184" rx="142" ry="22" fill="#000000" fill-opacity="0.2"/>
    <path d="M64 140 C56 112 104 92 152 94 C210 96 286 106 322 130 C334 139 330 152 310 158 C262 174 196 186 146 184 C100 182 76 168 64 140 Z" fill="#915a1c"/>
    <path d="M64 150 C76 172 100 184 146 186 C196 188 262 176 310 160 C322 156 327 150 322 138 C300 156 250 168 190 168 C140 168 92 162 64 150 Z" fill="#724311"/>
    <g transform="translate(0,-18)">
      <path d="M64 140 C56 112 104 92 152 94 C210 96 286 106 322 130 C334 139 330 152 310 158 C262 174 196 186 146 184 C100 182 76 168 64 140 Z" fill="#cb8a34"/>
      <path d="M118 150 C180 176 252 168 310 156 C324 152 330 146 322 132 C300 152 250 164 190 164 C158 164 136 158 118 150 Z" fill="#a4661d" fill-opacity="0.7"/>
      <path d="M70 134 C70 112 112 96 154 98 C202 100 252 108 292 122 C252 116 202 112 156 114 C112 116 84 124 70 134 Z" fill="#deaa5e" fill-opacity="0.85"/>
      <ellipse cx="130" cy="120" rx="58" ry="20" fill="#f0cd86" fill-opacity="0.55"/>
      <ellipse cx="116" cy="115" rx="34" ry="12" fill="#fbe9c8" fill-opacity="0.5"/>
      <g fill="none" stroke-linecap="round">
        <path d="M80 120 C140 110 232 112 300 128" stroke="#f3d9a6" stroke-width="1.6" stroke-opacity="0.5"/>
        <path d="M86 110 C150 102 222 104 282 118" stroke="#f3d9a6" stroke-width="1.4" stroke-opacity="0.45"/>
        <path d="M78 130 C140 122 234 124 304 138" stroke="#9a5e1c" stroke-width="1.2" stroke-opacity="0.4"/>
        <path d="M84 144 C150 140 228 142 302 150" stroke="#9a5e1c" stroke-width="1.2" stroke-opacity="0.4"/>
        <path d="M90 154 C150 152 220 154 296 158" stroke="#9a5e1c" stroke-width="1" stroke-opacity="0.35"/>
      </g>
      <path d="M72 150 C92 174 142 182 192 178 C150 174 104 168 84 154 Z" fill="#d39749" fill-opacity="0.85" stroke="#9a5f22" stroke-width="0.6"/>
      <path d="M92 158 C120 170 160 174 192 172" fill="none" stroke="#b9854a" stroke-width="1" stroke-opacity="0.5"/>
      <g stroke="#6e3a12" stroke-width="3" stroke-opacity="0.4" stroke-linecap="round">
        <line x1="120" y1="104" x2="100" y2="150"/><line x1="160" y1="106" x2="138" y2="156"/><line x1="200" y1="110" x2="180" y2="158"/>
      </g>
      <path d="M64 140 C56 112 104 92 152 94 C210 96 286 106 322 130 C334 139 330 152 310 158 C262 174 196 186 146 184 C100 182 76 168 64 140 Z" fill="none" stroke="#74400f" stroke-width="2" stroke-opacity="0.5"/>
      <g fill="#5f320e" fill-opacity="0.38"><ellipse cx="300" cy="138" rx="14" ry="9"/><ellipse cx="260" cy="126" rx="10" ry="6"/></g>
      <g fill="#fff6e6" fill-opacity="0.6"><circle cx="118" cy="112" r="2.2"/><circle cx="150" cy="108" r="1.6"/><circle cx="190" cy="112" r="1.6"/></g>
      <path d="M104 108 C140 100 196 102 244 112" fill="none" stroke="#ffeccb" stroke-width="2.6" stroke-opacity="0.4" stroke-linecap="round"/>
    </g>`, THERO);

  ART.entero_zanahoria = tile(`
    <ellipse cx="108" cy="152" rx="40" ry="10" fill="#000000" fill-opacity="0.22"/>
    <ellipse cx="105" cy="82" rx="15" ry="9" fill="#357f2c" fill-opacity="0.35"/>
    <use href="#gh_frond" transform="translate(96,84) rotate(-30) scale(1.0)"/>
    <use href="#gh_frond" transform="translate(101,85) rotate(-16) scale(1.15)"/>
    <use href="#gh_frond" transform="translate(105,85) rotate(-3) scale(1.28)"/>
    <use href="#gh_frond" transform="translate(109,85) rotate(9) scale(1.2)"/>
    <use href="#gh_frond" transform="translate(114,84) rotate(24) scale(1.05)"/>
    <use href="#gh_frond" transform="translate(99,86) rotate(-22) scale(0.9)"/>
    <use href="#gh_frond" transform="translate(111,86) rotate(15) scale(0.92)"/>
    <path d="M88 92 C86 86 96 84 106 84 C118 84 124 88 122 94 C118 120 112 142 108 152 C107 155 105 155 104 152 C98 138 90 114 88 92 Z" fill="url(#gh_carrot)"/>
    <g stroke="#b9580f" stroke-width="1.3" stroke-opacity="0.45" stroke-linecap="round"><path d="M93 102 L120 98"/><path d="M96 116 L117 113"/><path d="M99 130 L114 128"/></g>
    <path d="M97 94 C96 118 102 140 105 150" fill="none" stroke="#ffc77e" stroke-width="3" stroke-opacity="0.5" stroke-linecap="round"/>`, T210);

  ART.entero_apio = tile(`
    <ellipse cx="105" cy="150" rx="32" ry="8" fill="#000000" fill-opacity="0.2"/>
    <use href="#gh_cClus" transform="translate(82,66) scale(0.8)"/>
    <use href="#gh_cClus" transform="translate(128,66) scale(0.8)"/>
    <path d="M76 146 L80 76 Q84 70 89 76 L92 146 Q84 151 76 146 Z" fill="url(#gh_back)" stroke="#4a6f25" stroke-width="1"/>
    <path d="M118 146 L121 76 Q126 70 130 76 L134 146 Q126 151 118 146 Z" fill="url(#gh_back)" stroke="#4a6f25" stroke-width="1"/>
    <path d="M83 149 L86 72 Q94 65 102 72 L105 149 Q94 155 83 149 Z" fill="url(#gh_mid)" stroke="#5f8a2c" stroke-width="1"/>
    <path d="M105 149 L108 72 Q116 65 124 72 L127 149 Q116 155 105 149 Z" fill="url(#gh_mid)" stroke="#5f8a2c" stroke-width="1"/>
    <path d="M93 151 L95 69 Q105 62 115 69 L117 151 Q105 157 93 151 Z" fill="url(#gh_front)" stroke="#5f8a2c" stroke-width="1.1"/>
    <path d="M105 70 L105 148" stroke="#eef6d8" stroke-width="2.2" stroke-opacity="0.6" stroke-linecap="round"/>
    <path d="M96 71 L97 146" stroke="#cfe3a2" stroke-width="1" stroke-opacity="0.5"/>
    <path d="M114 71 L113 146" stroke="#9fc56a" stroke-width="1" stroke-opacity="0.5"/>
    <path d="M118 80 C124 110 124 130 120 146 L134 146 Q126 151 118 146 Z" fill="#3a5e22" fill-opacity="0.18"/>
    <path d="M93 151 Q105 157 117 151" fill="none" stroke="#cdbf9a" stroke-width="1.4" stroke-opacity="0.6"/>
    <use href="#gh_cClus" transform="translate(94,62) scale(0.92)"/>
    <use href="#gh_cClus" transform="translate(105,62) scale(1.05)"/>
    <use href="#gh_cClus" transform="translate(122,64) scale(0.95)"/>`, T210);

  /* ---------- ARTE: CORTES ---------- */

  ART.corte_tomate_rodaja = tile(`
    <g transform="translate(84,92)">
      <ellipse cx="0" cy="22" rx="38" ry="9" fill="#000000" fill-opacity="0.22"/>
      <path d="M-36 6 A36 34 0 0 0 36 6 L36 14 A36 34 0 0 1 -36 14 Z" fill="#b8311f"/>
      <ellipse cx="0" cy="0" rx="36" ry="34" fill="url(#gh_tomFlesh)"/>
      <ellipse cx="0" cy="0" rx="36" ry="34" fill="none" stroke="#cf3a26" stroke-width="5"/>
      <g stroke="#ffe0d6" stroke-width="5" stroke-linecap="round" opacity="0.85">
        <line x1="0" y1="0" x2="0" y2="-26"/><line x1="0" y1="0" x2="22" y2="-14"/><line x1="0" y1="0" x2="24" y2="12"/>
        <line x1="0" y1="0" x2="0" y2="26"/><line x1="0" y1="0" x2="-24" y2="12"/><line x1="0" y1="0" x2="-22" y2="-14"/>
      </g>
      <circle cx="0" cy="0" r="6" fill="#f6b9a6"/>
      <g fill="#f1e2a0" stroke="#bca24f" stroke-width="0.4">
        <ellipse cx="10" cy="-16" rx="2.4" ry="3.4"/><ellipse cx="18" cy="2" rx="2.4" ry="3.4"/><ellipse cx="6" cy="18" rx="2.4" ry="3.4"/>
        <ellipse cx="-12" cy="14" rx="2.4" ry="3.4"/><ellipse cx="-18" cy="-6" rx="2.4" ry="3.4"/><ellipse cx="-6" cy="-18" rx="2.4" ry="3.4"/>
      </g>
    </g>
    <g transform="translate(132,118)">
      <ellipse cx="0" cy="20" rx="32" ry="8" fill="#000000" fill-opacity="0.2"/>
      <path d="M-30 5 A30 28 0 0 0 30 5 L30 13 A30 28 0 0 1 -30 13 Z" fill="#b8311f"/>
      <ellipse cx="0" cy="0" rx="30" ry="28" fill="url(#gh_tomFlesh)"/>
      <ellipse cx="0" cy="0" rx="30" ry="28" fill="none" stroke="#cf3a26" stroke-width="4.5"/>
      <g stroke="#ffe0d6" stroke-width="4.5" stroke-linecap="round" opacity="0.85">
        <line x1="0" y1="0" x2="0" y2="-22"/><line x1="0" y1="0" x2="19" y2="-11"/><line x1="0" y1="0" x2="20" y2="11"/>
        <line x1="0" y1="0" x2="0" y2="22"/><line x1="0" y1="0" x2="-20" y2="11"/><line x1="0" y1="0" x2="-19" y2="-11"/>
      </g>
      <circle cx="0" cy="0" r="5" fill="#f6b9a6"/>
      <g fill="#f1e2a0" stroke="#bca24f" stroke-width="0.4">
        <ellipse cx="9" cy="-13" rx="2.1" ry="3"/><ellipse cx="15" cy="3" rx="2.1" ry="3"/><ellipse cx="-10" cy="12" rx="2.1" ry="3"/><ellipse cx="-15" cy="-5" rx="2.1" ry="3"/>
      </g>
    </g>`, "translate(6,2) scale(0.9)");

  ART.corte_tomate_cubos = tile(`
    <ellipse cx="106" cy="150" rx="74" ry="20" fill="#000000" fill-opacity="0.16"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(64,70) rotate(-8)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(98,62) scale(1.05) rotate(6)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(134,72) scale(0.95) rotate(-4)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(72,104) scale(1.1) rotate(10)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(108,98) rotate(-12)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(144,108) scale(1.05) rotate(4)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(90,132) scale(0.92) rotate(8)"/>
    <use href="#gh_cube" width="28" height="32" transform="translate(126,134) rotate(-6)"/>`, "translate(6,2) scale(0.9)");

  ART.corte_pepino_rodaja = tile(`
    <use href="#gh_cukeSlice" transform="translate(86,80)"/>
    <use href="#gh_cukeSlice" transform="translate(128,104) scale(0.86)"/>`, T210);

  ART.corte_cilantro_hebras = tile(`
    <ellipse cx="106" cy="116" rx="82" ry="46" fill="#000000" fill-opacity="0.12"/>
    <g stroke="#1f5a18" stroke-width="0.4">
      <rect x="-9" y="-1.9" width="18" height="3.8" rx="1.9" fill="#4fb33f" transform="translate(60,62) rotate(12)"/>
      <rect x="-10" y="-1.9" width="20" height="3.8" rx="1.9" fill="#3f9a35" transform="translate(86,56) rotate(-22)"/>
      <rect x="-8" y="-1.8" width="16" height="3.6" rx="1.8" fill="#56b840" transform="translate(110,60) rotate(34)"/>
      <rect x="-11" y="-2" width="22" height="4" rx="2" fill="#2f7a28" transform="translate(136,56) rotate(-8)"/>
      <rect x="-8" y="-1.8" width="16" height="3.6" rx="1.8" fill="#3f9a35" transform="translate(158,64) rotate(20)"/>
      <rect x="-9" y="-1.9" width="18" height="3.8" rx="1.9" fill="#46a23a" transform="translate(50,84) rotate(-32)"/>
      <rect x="-10" y="-1.9" width="20" height="3.8" rx="1.9" fill="#4fb33f" transform="translate(78,86) rotate(14)"/>
      <rect x="-8" y="-1.8" width="16" height="3.6" rx="1.8" fill="#357f2c" transform="translate(102,80) rotate(-44)"/>
      <rect x="-11" y="-2" width="22" height="4" rx="2" fill="#3f9a35" transform="translate(126,86) rotate(26)"/>
      <rect x="-9" y="-1.9" width="18" height="3.8" rx="1.9" fill="#56b840" transform="translate(150,84) rotate(-12)"/>
      <rect x="-7" y="-1.8" width="14" height="3.6" rx="1.8" fill="#2f7a28" transform="translate(168,90) rotate(40)"/>
      <rect x="-10" y="-1.9" width="20" height="3.8" rx="1.9" fill="#4fb33f" transform="translate(58,106) rotate(8)"/>
      <rect x="-9" y="-1.9" width="18" height="3.8" rx="1.9" fill="#3a8e30" transform="translate(84,110) rotate(-26)"/>
      <rect x="-11" y="-2" width="22" height="4" rx="2" fill="#56b840" transform="translate(110,104) rotate(32)"/>
      <rect x="-8" y="-1.8" width="16" height="3.6" rx="1.8" fill="#3f9a35" transform="translate(136,110) rotate(-10)"/>
      <rect x="-9" y="-1.9" width="18" height="3.8" rx="1.9" fill="#357f2c" transform="translate(160,106) rotate(22)"/>
      <rect x="-10" y="-1.9" width="20" height="3.8" rx="1.9" fill="#4fb33f" transform="translate(72,130) rotate(-34)"/>
      <rect x="-8" y="-1.8" width="16" height="3.6" rx="1.8" fill="#3f9a35" transform="translate(100,134) rotate(18)"/>
      <rect x="-11" y="-2" width="22" height="4" rx="2" fill="#46a23a" transform="translate(126,128) rotate(-20)"/>
      <rect x="-9" y="-1.9" width="18" height="3.8" rx="1.9" fill="#56b840" transform="translate(150,132) rotate(30)"/>
    </g>`, "translate(6,2) scale(0.9)");

  ART.corte_cebolla_fino = tile(`
    <ellipse cx="106" cy="116" rx="82" ry="46" fill="#000000" fill-opacity="0.12"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(50,58) rotate(20)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(70,54) rotate(-15)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(90,60) rotate(35)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(110,52) rotate(-25)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(130,58) rotate(10)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(150,54) rotate(-30)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(166,62) rotate(18)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(58,74) rotate(-10)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(78,78) rotate(28)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(98,72) rotate(-20)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(118,76) rotate(40)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(138,74) rotate(-12)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(158,78) rotate(22)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(52,92) rotate(15)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(72,96) rotate(-28)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(92,90) rotate(33)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(112,94) rotate(-18)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(132,92) rotate(25)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(152,96) rotate(-22)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(60,110) rotate(-16)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(80,114) rotate(30)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(100,108) rotate(-26)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(120,112) rotate(20)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(140,110) rotate(-14)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(158,114) rotate(36)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(72,128) rotate(-24)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(94,132) rotate(18)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(116,126) rotate(-30)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(138,130) rotate(26)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(86,146) rotate(22)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(110,148) rotate(-20)"/>
    <use href="#gh_onionbit" width="10" height="6" transform="translate(132,144) rotate(14)"/>`, "translate(6,2) scale(0.9)");

  ART.corte_albahaca_hoja = tile(`
    <ellipse cx="105" cy="120" rx="74" ry="34" fill="#000000" fill-opacity="0.12"/>
    <use href="#gh_leaf" transform="translate(72,86) rotate(-24) scale(1.3)"/>
    <use href="#gh_leaf" transform="translate(120,78) rotate(18) scale(1.5)"/>
    <use href="#gh_leaf" transform="translate(96,116) rotate(-8) scale(1.6)"/>
    <use href="#gh_leaf" transform="translate(140,116) rotate(34) scale(1.25)"/>`, T210);

  ART.corte_pollo_tiras = tile(`
    <ellipse cx="186" cy="200" rx="148" ry="20" fill="#000000" fill-opacity="0.18"/>
    <path d="M64 151 L81 163 L103 177 L127 183 L153 186 L179 185 L205 181 L231 170 L255 158 L279 150 L303 148 L303 166 L279 168 L255 176 L231 188 L205 199 L179 203 L153 204 L127 201 L103 195 L81 181 L64 169 Z" fill="url(#gh_paleFront)"/>
    <path d="M64 169 L81 181 L103 195 L127 201 L153 204 L179 203 L205 199 L231 188 L255 176 L279 168 L303 166" fill="none" stroke="#b58f50" stroke-width="2" stroke-opacity="0.6"/>
    <g stroke="#c8a35e" stroke-width="1" stroke-opacity="0.55">
      <line x1="83" y1="165" x2="83" y2="182"/><line x1="105" y1="178" x2="105" y2="196"/><line x1="129" y1="184" x2="129" y2="202"/>
      <line x1="155" y1="187" x2="155" y2="205"/><line x1="181" y1="186" x2="181" y2="204"/><line x1="207" y1="182" x2="207" y2="200"/>
      <line x1="233" y1="171" x2="233" y2="189"/><line x1="257" y1="159" x2="257" y2="177"/><line x1="281" y1="151" x2="281" y2="169"/>
    </g>
    <path d="M64 131 Q90 108 130 100 Q180 96 230 102 Q270 110 303 145 L303 148 Q270 158 230 186 Q180 190 130 184 Q90 168 64 151 Z" fill="#e6cd9c"/>
    <g fill="none" stroke="#cda86a" stroke-width="1" stroke-opacity="0.35"><path d="M88 148 C150 140 230 142 296 150"/><path d="M94 166 C150 160 224 162 286 166"/></g>
    <g stroke="#74400f" stroke-width="0.5">
      <path d="M64 131 Q72 113 81 117 L81 163 Q72 167 64 151 Z" fill="url(#gh_meat)"/>
      <path d="M85 116 Q94 105 103 109 L103 177 Q94 181 85 164 Z" fill="url(#gh_meat)"/>
      <path d="M107 108 Q117 99 127 103 L127 183 Q117 187 107 177 Z" fill="url(#gh_meat)"/>
      <path d="M131 102 Q142 96 153 100 L153 186 Q142 190 131 184 Z" fill="url(#gh_meat)"/>
      <path d="M157 100 Q168 96 179 101 L179 185 Q168 189 157 186 Z" fill="url(#gh_meat)"/>
      <path d="M183 101 Q194 97 205 107 L205 181 Q194 185 183 184 Z" fill="url(#gh_meat)"/>
      <path d="M209 108 Q220 104 231 116 L231 170 Q220 174 209 180 Z" fill="url(#gh_meat)"/>
      <path d="M235 116 Q245 112 255 126 L255 158 Q245 162 235 170 Z" fill="url(#gh_meat)"/>
      <path d="M259 126 Q269 122 279 137 L279 150 Q269 154 259 158 Z" fill="url(#gh_meat)"/>
      <path d="M283 138 Q293 134 303 145 L303 148 Q293 152 283 150 Z" fill="url(#gh_meat)"/>
    </g>
    <g fill="none" stroke="#ffeccb" stroke-width="2" stroke-opacity="0.5" stroke-linecap="round">
      <path d="M67 132 Q73 119 79 120"/><path d="M88 117 Q95 108 101 111"/><path d="M110 109 Q118 102 125 105"/>
      <path d="M134 103 Q143 98 151 102"/><path d="M160 102 Q169 98 177 103"/><path d="M186 103 Q194 99 203 109"/>
      <path d="M212 110 Q221 106 229 117"/><path d="M238 118 Q246 114 253 127"/><path d="M262 128 Q270 124 277 138"/>
    </g>
    <g fill="none" stroke="#8a5418" stroke-width="1.6" stroke-opacity="0.4" stroke-linecap="round">
      <path d="M67 158 Q73 165 79 161"/><path d="M88 171 Q95 178 101 174"/><path d="M110 178 Q118 184 125 180"/>
      <path d="M134 181 Q143 187 151 183"/><path d="M160 182 Q169 186 177 181"/><path d="M186 180 Q194 184 203 177"/>
      <path d="M212 176 Q221 179 229 167"/><path d="M238 166 Q246 168 253 154"/>
    </g>
    <g stroke="#9a5e1c" stroke-width="0.8" stroke-opacity="0.4" fill="none">
      <path d="M71 124 L70 158"/><path d="M93 116 L92 170"/><path d="M116 114 L115 178"/><path d="M141 110 L141 182"/>
      <path d="M167 110 L167 182"/><path d="M193 112 L193 178"/><path d="M219 118 L219 172"/><path d="M244 126 L244 162"/>
    </g>`, THERO);

  ART.corte_zanahoria_bastones = tile(`
    <ellipse cx="105" cy="124" rx="60" ry="12" fill="#000000" fill-opacity="0.18"/>
    <use href="#gh_carrotBaton" transform="translate(78,86) rotate(-8)"/>
    <use href="#gh_carrotBaton" transform="translate(105,82) rotate(3)"/>
    <use href="#gh_carrotBaton" transform="translate(132,88) rotate(11)"/>`, T210);

  ART.corte_apio_bastones = tile(`
    <ellipse cx="105" cy="124" rx="60" ry="12" fill="#000000" fill-opacity="0.18"/>
    <use href="#gh_celeryBaton" transform="translate(78,86) rotate(-8)"/>
    <use href="#gh_celeryBaton" transform="translate(105,82) rotate(3)"/>
    <use href="#gh_celeryBaton" transform="translate(132,88) rotate(11)"/>`, T210);

  /* ---------- API PÚBLICA ---------- */
  let defsInyectados = false;

  function inyectarDefs() {
    if (defsInyectados) return;
    const host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    host.setAttribute("width", "0");
    host.setAttribute("height", "0");
    host.setAttribute("aria-hidden", "true");
    host.style.position = "absolute";
    host.innerHTML = DEFS;
    document.body.appendChild(host);
    defsInyectados = true;
  }

  function obtener(svgId) {
    return ART[svgId] || "";
  }

  global.GameHutSVG = { inyectarDefs, obtener, ART };

})(window);