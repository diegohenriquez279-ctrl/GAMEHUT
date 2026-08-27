#!/usr/bin/env node
/* ============================================================
   generate-brand-pngs.js — PNG derivados de los SVG de marca

   1) Familia del icono GameHut: lee assets/brand/gamehut-icon.svg
      y genera los PNG (32, 192, 512 px), fondo transparente.
   2) Logo HutAcademy: lee assets/brand/hutacademy-logo.svg y
      genera assets/brand/hutacademy-logo.png a 400px de ancho
      (alto proporcional), fondo transparente.

   Re-ejecutable sin efectos secundarios:
       node scripts/generate-brand-pngs.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RAIZ = path.resolve(__dirname, '..');
const BRAND = path.join(RAIZ, 'assets', 'brand');

const ICONO_SVG = path.join(BRAND, 'gamehut-icon.svg');
const ICONO_TAMANIOS = [32, 192, 512];

const HUTACADEMY_SVG = path.join(BRAND, 'hutacademy-logo.svg');
const HUTACADEMY_PNG = path.join(BRAND, 'hutacademy-logo.png');
const HUTACADEMY_ANCHO = 400;

const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

async function generarIconosGameHut() {
  if (!fs.existsSync(ICONO_SVG)) {
    console.error('No se encontró el SVG fuente: ' + ICONO_SVG);
    process.exit(1);
  }
  const svgBuffer = fs.readFileSync(ICONO_SVG);
  for (const size of ICONO_TAMANIOS) {
    const salida = path.join(BRAND, 'gamehut-icon-' + size + '.png');
    await sharp(svgBuffer, { density: 384 })
      .resize(size, size, { fit: 'contain', background: TRANSPARENTE })
      .png()
      .toFile(salida);
    console.log('Generado: assets/brand/gamehut-icon-' + size + '.png (' + size + 'x' + size + ')');
  }
}

async function generarLogoHutAcademy() {
  if (!fs.existsSync(HUTACADEMY_SVG)) {
    console.error('No se encontró el SVG fuente: ' + HUTACADEMY_SVG);
    process.exit(1);
  }
  // density alta para rasterizar nítido antes de ajustar a 400px de ancho.
  const svgBuffer = fs.readFileSync(HUTACADEMY_SVG);
  await sharp(svgBuffer, { density: 200 })
    .resize({ width: HUTACADEMY_ANCHO, background: TRANSPARENTE })
    .png()
    .toFile(HUTACADEMY_PNG);
  const meta = await sharp(HUTACADEMY_PNG).metadata();
  console.log('Generado: assets/brand/hutacademy-logo.png (' + meta.width + 'x' + meta.height + ')');
}

async function main() {
  await generarIconosGameHut();
  await generarLogoHutAcademy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
