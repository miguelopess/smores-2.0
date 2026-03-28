const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sharp = (await import('sharp')).default;

  // Create a clean SVG with a house emoji approximation using shapes
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- House icon -->
  <g transform="translate(256,260)" fill="white">
    <!-- Roof -->
    <polygon points="0,-130 150,20 -150,20" fill="white"/>
    <!-- Body -->
    <rect x="-110" y="20" width="220" height="140" rx="8" fill="white"/>
    <!-- Door -->
    <rect x="-30" y="70" width="60" height="90" rx="6" fill="#7c3aed"/>
    <!-- Window left -->
    <rect x="-90" y="50" width="45" height="40" rx="4" fill="#7c3aed"/>
    <!-- Window right -->
    <rect x="45" y="50" width="45" height="40" rx="4" fill="#7c3aed"/>
    <!-- Checkmark -->
    <g transform="translate(70,-80)">
      <circle cx="0" cy="0" r="35" fill="#22c55e"/>
      <polyline points="-15,0 -5,12 18,-12" stroke="white" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
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
