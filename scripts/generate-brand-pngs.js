#!/usr/bin/env node
/* ============================================================
   generate-brand-pngs.js — Familia PNG del icono de marca

   Lee assets/brand/gamehut-icon.svg y genera los PNG derivados
   (32, 192, 512 px) con fondo transparente preservado del SVG.
   Re-ejecutable sin efectos secundarios:
       node scripts/generate-brand-pngs.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RAIZ = path.resolve(__dirname, '..');
const SVG = path.join(RAIZ, 'assets', 'brand', 'gamehut-icon.svg');
const TAMANIOS = [32, 192, 512];

async function main() {
  if (!fs.existsSync(SVG)) {
    console.error('No se encontró el SVG fuente: ' + SVG);
    process.exit(1);
  }
  const svgBuffer = fs.readFileSync(SVG);

  for (const size of TAMANIOS) {
    const salida = path.join(RAIZ, 'assets', 'brand', 'gamehut-icon-' + size + '.png');
    await sharp(svgBuffer, { density: 384 })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparente
      })
      .png()
      .toFile(salida);
    console.log('Generado: assets/brand/gamehut-icon-' + size + '.png (' + size + 'x' + size + ')');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
