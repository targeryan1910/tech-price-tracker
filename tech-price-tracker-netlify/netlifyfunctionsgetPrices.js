import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { products } from "../../products.js";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";

puppeteerExtra.use(StealthPlugin());

export const handler = async () => {
  const browser = await puppeteerExtra.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
  );

  const results = [];

  for (const p of products) {
    try {
      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 60000 });
      const priceText = await page.$eval(p.selector, el => el.innerText);
      const price = priceText.replace(/[^\d,]/g, "").replace(",", ".");
      results.push({ name: p.name, price: `${price} TL` });
    } catch (err) {
      results.push({ name: p.name, price: "Fiyat çekilemedi ❌" });
    }
  }

  await browser.close();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(results)
  };
};
