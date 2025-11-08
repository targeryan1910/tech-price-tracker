const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const products = require('./products');

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());

let latestPrices = [];

async function updatePrices() {
  const browser = await puppeteer.launch({ headless: true }); // arka planda çalışacak
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
  );

  for (const p of products) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Burada fiyat çekme kodu önceki çalışan yöntemle
      const priceText = await page.$eval(p.selector, el => el.innerText);
      const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));
      console.log(`${p.name} → Fiyat: ${price} TL`);

      const index = latestPrices.findIndex(item => item.name === p.name);
      if (index >= 0) latestPrices[index].price = price;
      else latestPrices.push({ name: p.name, price });
    } catch (err) {
      console.error(`${p.name} fiyat çekilemedi! Hata: ${err.message}`);
    }
  }

  await browser.close();
}

// İlk çalıştır
updatePrices();

// 30 saniyede bir fiyatları güncelle
setInterval(updatePrices, 30000);

// Frontend API
app.get('/api/products', (req, res) => res.json(latestPrices));

app.listen(3000, () => console.log("Server http://localhost:3000 çalışıyor"));
