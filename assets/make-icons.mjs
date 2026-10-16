// Gera os PNGs do PWA a partir de public/icons/icon.svg com o Chromium do Playwright.
// Uso: node assets/make-icons.mjs   (precisa do pacote playwright disponível)
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url), "utf8");
const targets = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["apple-touch-icon.png", 180, 0],
  // maskable: o desenho precisa caber na zona segura (80% central)
  ["maskable-512.png", 512, 0.12],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
for (const [name, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><body style="margin:0;background:#0a0b14;display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: new URL(`../public/icons/${name}`, import.meta.url).pathname, omitBackground: false });
}
await browser.close();
console.log("ícones gerados");
