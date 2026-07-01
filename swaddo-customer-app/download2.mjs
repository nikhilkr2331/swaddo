import fs from 'fs';
import path from 'path';

const images = {
  "biryani.jpg": "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=200&q=80",
  "dosa.jpg": "https://images.unsplash.com/photo-1627308595229-7830f5c92842?w=200&q=80",
  "gulab_jamun.jpg": "https://images.unsplash.com/photo-1605197148782-e30488cd72dc?w=200&q=80",
  "idli.jpg": "https://images.unsplash.com/photo-1589301773112-0058e515d91c?w=200&q=80",
  "pasta.jpg": "https://images.unsplash.com/photo-1621996311210-ea443046f223?w=200&q=80",
  "rasgulla.jpg": "https://images.unsplash.com/photo-1598428269784-7e99b2447990?w=200&q=80",
  "rolls.jpg": "https://images.unsplash.com/photo-1626804475297-4160bbdf42e0?w=200&q=80",
  "south_indian.jpg": "https://images.unsplash.com/photo-1610190179961-5b6fb89b4b04?w=200&q=80"
};

const dir = path.join(process.cwd(), 'public', 'categories');

async function download() {
  for (const [filename, url] of Object.entries(images)) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(path.join(dir, filename), buffer);
      console.log(`Downloaded ${filename}`);
    } catch (err) {
      console.log(`Failed ${filename}: ${err.message}`);
    }
  }
}
download();
