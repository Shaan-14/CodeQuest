/** Tiles screenshots into one image for quick review. Usage: node scripts/contact.mjs <out.png> <cols> <thumb-width> img1 img2 ... */
import { chromium } from 'playwright-core';
import { readdirSync, writeFileSync, readFileSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const [out, cols, tw, ...imgs] = process.argv.slice(2);
const W = Number(tw), H = Math.round(W * 0.5625);
const html = `<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(${cols},${W}px);gap:2px">${imgs.map((f, i) => `<div style="position:relative"><img src="data:image/png;base64,${readFileSync(f).toString('base64')}" width="${W}" height="${H}"><span style="position:absolute;left:4px;top:2px;color:#ff0;font:12px monospace;background:#0008">${i}</span></div>`).join('')}</body>`;
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: Number(cols) * (W + 2), height: Math.ceil(imgs.length / Number(cols)) * (H + 2) } });
await p.setContent(html); await p.waitForTimeout(500); await p.screenshot({ path: out }); await b.close();
