#!/usr/bin/env node
/* ============================================================
   stamp-version.js — Cache-busting local (Frente C · Punto 1)

   Actualiza el token ?v=YYYYMMDD en los atributos href y src de
   los 6 HTML del proyecto, usando la FECHA DE HOY. Reemplaza el
   valor manual anterior (mismo esquema de 8 dígitos, p. ej.
   20260813).

   Uso:
     node scripts/stamp-version.js        (o:  npm run stamp)

   No configura GitHub Actions ni hooks de git: se corre a mano
   cuando se decida, antes de un commit. No modifica nada más que
   los tokens ?v= de 8 dígitos en los HTML listados.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

/* Token = fecha de hoy en formato YYYYMMDD (mismo esquema que el
   valor manual actual: 20260813). */
function tokenDeHoy() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}

const RAIZ = path.resolve(__dirname, '..');
const ARCHIVOS = [
  'index.html',
  'minijuego-1.html',
  'minijuego-2.html',
  'minijuego-3.html',
  'minijuego-4.html',
  'minijuego-5.html'
];

/* Solo tokens de versión: ?v= seguido de exactamente 8 dígitos.
   Estos únicamente aparecen en atributos href/src de los HTML. */
const PATRON = /\?v=\d{8}/g;

function main() {
  const token = tokenDeHoy();
  const nuevo = '?v=' + token;
  let totalReemplazos = 0;

  console.log('Token del día: ' + token);
  console.log('------------------------------------------');

  ARCHIVOS.forEach((rel) => {
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) {
      console.log(rel + ': NO ENCONTRADO (omitido)');
      return;
    }
    const original = fs.readFileSync(abs, 'utf8');
    const coincidencias = original.match(PATRON);
    const cantidad = coincidencias ? coincidencias.length : 0;
    const actualizado = original.replace(PATRON, nuevo);

    if (actualizado !== original) {
      fs.writeFileSync(abs, actualizado);
    }

    totalReemplazos += cantidad;
    console.log(rel + ': ' + cantidad + ' reemplazo(s) → ' + nuevo);
  });

  console.log('------------------------------------------');
  console.log('Archivos procesados: ' + ARCHIVOS.length);
  console.log('Reemplazos totales: ' + totalReemplazos);
}

main();
