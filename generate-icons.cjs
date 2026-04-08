const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sharp = (await import('sharp')).default;

  // Read SVG from file
  const svg = fs.readFileSync('public/favicon.svg', 'utf8');

  // Generate PNGs
  await sharp(Buffer.from(svg)).resize(512, 512, { fit: 'contain', background: { r: 10, g: 25, b: 26, alpha: 1 } }).png().toFile('public/icon-512x512.png');
  await sharp(Buffer.from(svg)).resize(192, 192, { fit: 'contain', background: { r: 10, g: 25, b: 26, alpha: 1 } }).png().toFile('public/icon-192x192.png');
  // Apple touch icon (180x180)
  await sharp(Buffer.from(svg)).resize(180, 180, { fit: 'contain', background: { r: 10, g: 25, b: 26, alpha: 1 } }).png().toFile('public/apple-touch-icon.png');

  console.log('Generated: favicon.svg, icon-192x192.png, icon-512x512.png, apple-touch-icon.png');
}

generateIcons().catch(console.error);
