/**
 * Generates PNG icons for the PWA manifest from inline SVG data.
 * Run once: node scripts/generate-icons.js
 *
 * Uses only Node built-ins — no external deps needed.
 * The output PNGs are minimal but valid placeholder icons.
 *
 * For production, replace with properly designed artwork.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');

mkdirSync(OUT, { recursive: true });

// Minimal valid 1x1 orange PNG (base64) stretched via the manifest size declaration.
// Replace with real artwork before shipping to production.
const ORANGE_1PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

writeFileSync(join(OUT, 'icon-192.png'), ORANGE_1PX_PNG);
writeFileSync(join(OUT, 'icon-512.png'), ORANGE_1PX_PNG);

console.log('✓ Placeholder PNG icons written to public/icons/');
console.log('  Replace with real artwork for production use.');
