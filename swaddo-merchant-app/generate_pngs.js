const sharp = require('sharp');
const fs = require('fs');

async function processIcon(appName) {
  const svgPath = `../${appName}/public/icon_backup.svg`;
  const png192 = `../${appName}/public/icon-192x192.png`;
  const png512 = `../${appName}/public/icon-512x512.png`;

  if (fs.existsSync(svgPath)) {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(png512);
    
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(png192);
    
    console.log(`Generated PNGs for ${appName}`);
  }
}

async function run() {
  await processIcon('swaddo-merchant-app');
  await processIcon('swaddo-delivery-app');
}

run();
