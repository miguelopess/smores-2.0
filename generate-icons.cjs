const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sharp = (await import('sharp')).default;

  // Homi logo - dark teal background with concentric rings and green text
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d3333"/>
      <stop offset="100%" stop-color="#061a1a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="34" y="34" width="444" height="444" rx="76" fill="none" stroke="#1d4d4d" stroke-width="1.5"/>
  <rect x="65" y="65" width="382" height="382" rx="65" fill="none" stroke="#1d4d4d" stroke-width="1.5"/>
  <rect x="96" y="96" width="320" height="320" rx="54" fill="none" stroke="#1d4d4d" stroke-width="1.5"/>
  <rect x="127" y="127" width="258" height="258" rx="43" fill="none" stroke="#1d4d4d" stroke-width="1.5"/>
  <text x="256" y="300" font-family="Arial Black, Arial, sans-serif" font-size="108" font-weight="900" fill="#4ade80" text-anchor="middle">Homi</text>
</svg>`;

  fs.writeFileSync('public/favicon.svg', svg);

  // Generate PNGs
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile('public/icon-192x192.png');
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('public/icon-512x512.png');
  // Apple touch icon (180x180)
  await sharp(Buffer.from(svg)).resize(180, 180).png().toFile('public/apple-touch-icon.png');

  console.log('Generated: favicon.svg, icon-192x192.png, icon-512x512.png, apple-touch-icon.png');
}

generateIcons().catch(console.error);
