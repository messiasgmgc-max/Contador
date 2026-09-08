const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Design harmonioso com safe zone (padding adequado)
// 108dp adaptive icon foreground: safe area central de 66dp ou 72dp
// ViewBox 108x108 com desenho ocupando ~56x56 no centro (x: 26 a 82, y: 26 a 82)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
  <g transform="translate(54, 54) scale(0.60) translate(-54, -54)">
    <!-- Carteira / Base Financeira -->
    <rect x="24" y="32" width="60" height="44" rx="8" fill="#FFFFFF" />
    
    <!-- Detalhe superior -->
    <path d="M 24 40 C 24 35.58 27.58 32 32 32 L 76 32 C 80.42 32 84 35.58 84 40 L 84 44 L 24 44 Z" fill="#DBEAFE" />
    
    <!-- Fecho lateral -->
    <rect x="62" y="44" width="22" height="18" rx="4" fill="#1E40AF" />
    
    <!-- Ponto dourado/moeda -->
    <circle cx="77" cy="53" r="3" fill="#FBBF24" />
    
    <!-- Seta verde de crescimento financeiro -->
    <path d="M 42 44 L 32 54 L 38 54 L 38 64 L 46 64 L 46 54 L 52 54 Z" fill="#10B981" />
  </g>
</svg>`;

const fullAppIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
  </defs>
  <!-- Background com cantos suavemente arredondados -->
  <rect width="512" height="512" rx="115" fill="url(#blueGrad)"/>
  
  <!-- Círculo sutil decorativo -->
  <circle cx="256" cy="256" r="190" fill="#FFFFFF" fill-opacity="0.06" />

  <!-- Carteira Central proporcional com safe margin perfeita -->
  <g transform="translate(256, 256) scale(0.65) translate(-256, -256)">
    <!-- Corpo da Carteira -->
    <rect x="120" y="160" width="272" height="192" rx="36" fill="#FFFFFF" />
    
    <!-- Aba Superior -->
    <path d="M 120 196 C 120 176.12 136.12 160 156 160 L 356 160 C 375.88 160 392 176.12 392 196 L 392 210 L 120 210 Z" fill="#DBEAFE" />
    
    <!-- Fecho lateral da carteira -->
    <rect x="290" y="215" width="102" height="78" rx="18" fill="#1E40AF" />
    
    <!-- Botão / Moeda Dourada -->
    <circle cx="355" cy="254" r="13" fill="#FBBF24" />
    <circle cx="355" cy="254" r="7" fill="#F59E0B" />
    
    <!-- Seta verde de lucros subindo -->
    <path d="M 205 210 L 160 255 L 186 255 L 186 300 L 224 300 L 224 255 L 250 255 Z" fill="#10B981" />
  </g>
</svg>`;

async function run() {
  const baseDir = path.resolve(__dirname);
  
  // 1. Salvar svg e pngs no public
  fs.writeFileSync(path.join(baseDir, 'public/favicon.svg'), fullAppIconSvg);
  await sharp(Buffer.from(fullAppIconSvg)).resize(512, 512).png().toFile(path.join(baseDir, 'public/app-icon.png'));
  await sharp(Buffer.from(fullAppIconSvg)).resize(64, 64).png().toFile(path.join(baseDir, 'public/favicon.png'));
  
  // 2. Gerar tamanhos para mipmap do android (legado e adaptive)
  const densities = [
    { dir: 'mobile/app/src/main/res/mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mobile/app/src/main/res/mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mobile/app/src/main/res/mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mobile/app/src/main/res/mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mobile/app/src/main/res/mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const d of densities) {
    const fullDir = path.join(baseDir, d.dir);
    if (fs.existsSync(fullDir)) {
      // ic_launcher.png
      await sharp(Buffer.from(fullAppIconSvg))
        .resize(d.size, d.size)
        .png()
        .toFile(path.join(fullDir, 'ic_launcher.png'));

      // ic_launcher_round.png
      await sharp(Buffer.from(fullAppIconSvg))
        .resize(d.size, d.size)
        .composite([{
          input: Buffer.from(`<svg><circle cx="${d.size/2}" cy="${d.size/2}" r="${d.size/2}" fill="#fff"/></svg>`),
          blend: 'dest-in'
        }])
        .png()
        .toFile(path.join(fullDir, 'ic_launcher_round.png'));

      // ic_launcher_foreground.png
      await sharp(Buffer.from(foregroundSvg))
        .resize(d.fgSize, d.fgSize)
        .png()
        .toFile(path.join(fullDir, 'ic_launcher_foreground.png'));
    }
  }

  console.log('All icons generated successfully!');
}

run().catch(console.error);
