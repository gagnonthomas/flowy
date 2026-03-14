const sharp = require("sharp");
const path = require("path");

// SVG du logo Flowi (version statique, sans animation)
const logoSvg = (size, padding = 0.18) => {
  const scale = size * (1 - padding * 2);
  const cx = size / 2;
  const cy = size / 2 + size * 0.1; // légèrement vers le bas pour centrer visuellement

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="white"/>
  <g transform="translate(${cx}, ${cy}) scale(${scale / 280})" fill="white" stroke="#7C3AED" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <!-- Feuille gauche -->
    <path d="M -10,20 C -35,45 -100,42 -128,16 C -112,-14 -58,-2 -10,20 Z"/>
    <!-- Feuille droite -->
    <path d="M 10,20 C 35,45 100,42 128,16 C 112,-14 58,-2 10,20 Z"/>
    <!-- Pétale gauche -->
    <path d="M -5,14 C -40,2 -76,-48 -56,-104 C -32,-82 -12,-32 -5,14 Z"/>
    <!-- Pétale droit -->
    <path d="M 5,14 C 40,2 76,-48 56,-104 C 32,-82 12,-32 5,14 Z"/>
    <!-- Pétale central -->
    <path d="M 0,14 C -26,-24 -23,-90 0,-130 C 23,-90 26,-24 0,14 Z"/>
  </g>
</svg>`;
};

const assetsDir = path.join(__dirname, "..", "assets");

async function generate() {
  const configs = [
    { file: "icon.png", size: 1024, padding: 0.18 },
    { file: "adaptive-icon.png", size: 1024, padding: 0.22 },
    { file: "splash-icon.png", size: 200, padding: 0.15 },
    { file: "favicon.png", size: 48, padding: 0.1 },
  ];

  for (const { file, size, padding } of configs) {
    const svg = logoSvg(size, padding);
    const outPath = path.join(assetsDir, file);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✓ ${file} (${size}x${size})`);
  }
  console.log("\nTous les assets ont été générés dans assets/");
}

generate().catch(console.error);
