const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sharp = (await import('sharp')).default;

  // Homi logo - squircle rings (superellipse) style, dark teal gradient
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#1a5858"/>
      <stop offset="100%" stop-color="#071818"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <path d="M 488,256 C 488,435 435,488 256,488 C 77,488 24,435 24,256 C 24,77 77,24 256,24 C 435,24 488,77 488,256 Z" fill="none" stroke="rgba(80,180,160,0.30)" stroke-width="1.2"/>
  <path d="M 452,256 C 452,407 407,452 256,452 C 105,452 60,407 60,256 C 60,105 105,60 256,60 C 407,60 452,105 452,256 Z" fill="none" stroke="rgba(80,180,160,0.26)" stroke-width="1.2"/>
  <path d="M 416,256 C 416,379 379,416 256,416 C 133,416 96,379 96,256 C 96,133 133,96 256,96 C 379,96 416,133 416,256 Z" fill="none" stroke="rgba(80,180,160,0.22)" stroke-width="1.2"/>
  <path d="M 380,256 C 380,352 352,380 256,380 C 160,380 132,352 132,256 C 132,160 160,132 256,132 C 352,132 380,160 380,256 Z" fill="none" stroke="rgba(80,180,160,0.18)" stroke-width="1.2"/>
  <text x="256" y="285" font-family="'Nunito','Varela Round','Arial Rounded MT Bold',Calibri,sans-serif" font-size="112" font-weight="600" fill="#3dd9a0" text-anchor="middle">Homi</text>
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
