import https from 'https';
import fs from 'fs';
import path from 'path';

const images = {
  "biryani.jpg": "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=200&q=80",
  "north_indian.jpg": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80",
  "cake.jpg": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80",
  "pizza.jpg": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80",
  "south_indian.jpg": "https://images.unsplash.com/photo-1610190179961-5b6fb89b4b04?w=200&q=80",
  "desserts.jpg": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=80",
  "chinese.jpg": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80",
  "noodles.jpg": "https://images.unsplash.com/photo-1552611052-33e04de081de?w=200&q=80",
  "ice_cream.jpg": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80",
  "paratha.jpg": "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&q=80",
  "chole_bhature.jpg": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=200&q=80",
  "coffee.jpg": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=200&q=80",
  "idli.jpg": "https://images.unsplash.com/photo-1589301773112-0058e515d91c?w=200&q=80",
  "pastry.jpg": "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=200&q=80",
  "rolls.jpg": "https://images.unsplash.com/photo-1626804475297-4160bbdf42e0?w=200&q=80",
  "burger.jpg": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80",
  "dosa.jpg": "https://images.unsplash.com/photo-1627308595229-7830f5c92842?w=200&q=80",
  "pasta.jpg": "https://images.unsplash.com/photo-1621996311210-ea443046f223?w=200&q=80",
  "rasgulla.jpg": "https://images.unsplash.com/photo-1598428269784-7e99b2447990?w=200&q=80",
  "gulab_jamun.jpg": "https://images.unsplash.com/photo-1605197148782-e30488cd72dc?w=200&q=80"
};

const dir = path.join(process.cwd(), 'public', 'categories');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

Object.entries(images).forEach(([filename, url]) => {
  const filepath = path.join(dir, filename);
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
        const file = fs.createWriteStream(filepath);
        res2.pipe(file);
      });
    } else {
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
    }
  }).on('error', (err) => console.log('Error downloading', filename, err.message));
});

console.log('Downloading 20 images to public/categories...');
