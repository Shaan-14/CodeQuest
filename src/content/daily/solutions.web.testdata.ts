/**
 * TEST-ONLY DATA: reference solutions and plausible wrong attempts for the web Daily Challenges (run in Chromium by
 * content/web/web.test.ts).
 */
import type { WebFiles } from '../schema';
import { HTMLS } from './web';

type Sol = { valid: WebFiles[]; wrong: WebFiles[] };
const F = (html: string, css = '', js = ''): WebFiles => ({ html, css, js });
const J = (js: string, html = ''): WebFiles => ({ html, css: '', js });
const repJ = (js: string, from: string | RegExp, to: string) => {
  const out = js.replace(from, to);
  if (out === js) throw new Error('daily web solutions: replacement did nothing: ' + String(from));
  return out;
};

const statusHtml = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Line 3 Status</title>\n</head>\n<body>\n<h1>Line 3 Status</h1>\n<p>Live figures for the machines on Line 3.</p>\n<table>\n  <caption>Machines today</caption>\n  <thead><tr><th scope="col">Machine</th><th scope="col">State</th><th scope="col">Output</th></tr></thead>\n  <tbody>\n    <tr><td>Press</td><td>running</td><td>340</td></tr>\n    <tr><td>Lathe</td><td>idle</td><td>0</td></tr>\n    <tr><td>Welder</td><td>running</td><td>128</td></tr>\n  </tbody>\n</table>\n</body>\n</html>\n';
const signup = '<form>\n  <label for="e">Email</label> <input id="e" type="email" required>\n  <label for="a">Age</label> <input id="a" type="number" min="18" max="65" step="1" required>\n  <label for="u">Username</label> <input id="u" type="text" required minlength="3" maxlength="12" pattern="[A-Za-z0-9]{3,12}">\n  <label><input type="checkbox" required> I accept the terms</label>\n  <button type="submit">Register</button>\n</form>\n';
const badgeCss = '.badges { display: flex; gap: 8px; flex-wrap: nowrap; }\n.badge { padding: 6px 14px; border-radius: 999px; color: #fff; font-weight: bold; font-size: 14px; white-space: nowrap; }\n.badge:nth-child(1) { background: #1b7f3b; }\n.badge:nth-child(2) { background: #b57600; }\n.badge:nth-child(3) { background: #b00020; }\n';
const twoColCss = '* { box-sizing: border-box; }\nbody { margin: 0; }\n.layout { display: flex; gap: 20px; padding: 16px; }\n.side { width: 240px; flex: none; background: #1a3a6b; color: #fff; padding: 12px; }\n.content { flex: 1; background: #f2f5fa; padding: 12px; min-width: 0; }\n@media (max-width: 699px) {\n  .layout { flex-direction: column; }\n  .side { width: auto; }\n}\n';
const cardCss = '* { box-sizing: border-box; }\nbody { margin: 0; }\n.cards { display: grid; grid-template-columns: 1fr; gap: 16px; padding: 16px; }\n.card { min-height: 80px; background: #eee; }\n@media (min-width: 600px) { .cards { grid-template-columns: repeat(2, 1fr); } }\n@media (min-width: 900px) { .cards { grid-template-columns: repeat(3, 1fr); } }\n';

const median = 'function median(numbers) {\n  if (numbers.length === 0) return null;\n  const sorted = [...numbers].sort((a, b) => a - b);\n  const mid = Math.floor(sorted.length / 2);\n  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;\n}\n';
const sumBy = 'function sumBy(items, key, valueKey) {\n  const cents = {};\n  for (const item of items) {\n    const value = item[valueKey];\n    if (typeof value !== "number" || !Number.isFinite(value)) continue;\n    cents[item[key]] = (cents[item[key]] || 0) + Math.round(value * 100);\n  }\n  const result = {};\n  for (const k of Object.keys(cents)) result[k] = cents[k] / 100;\n  return result;\n}\n';
const slugify = 'function slugify(title) {\n  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");\n}\n';
const duration = 'function parseDuration(text) {\n  const m = /^(?:(\\d+)h)?\\s*(?:(\\d+)m)?$/.exec(text.trim());\n  if (!m || (!m[1] && !m[2])) return null;\n  return Number(m[1] || 0) * 60 + Number(m[2] || 0);\n}\n';
const latest = 'function latestPerId(records) {\n  const byId = new Map();\n  for (const r of records) {\n    const current = byId.get(r.id);\n    if (!current || r.updated >= current.updated) byId.set(r.id, r);\n  }\n  return [...byId.values()].sort((a, b) => a.id - b.id);\n}\n';
const firstSuccess = 'function firstSuccess(tasks) {\n  return new Promise((resolve, reject) => {\n    let failed = 0;\n    if (tasks.length === 0) reject(new Error("all failed"));\n    for (const task of tasks) {\n      Promise.resolve()\n        .then(task)\n        .then(resolve, () => {\n          failed++;\n          if (failed === tasks.length) reject(new Error("all failed"));\n        });\n    }\n  });\n}\n';
const debounce = 'function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n';

const tabsJs = 'const tabs = [...document.querySelectorAll("[role=tab]")];\nfunction select(index) {\n  tabs.forEach((tab, i) => {\n    tab.setAttribute("aria-selected", String(i === index));\n    document.getElementById(tab.dataset.panel).hidden = i !== index;\n  });\n  tabs[index].focus();\n}\ntabs.forEach((tab, i) => {\n  tab.addEventListener("click", () => select(i));\n  tab.addEventListener("keydown", (event) => {\n    if (event.key === "ArrowRight") select((i + 1) % tabs.length);\n    if (event.key === "ArrowLeft") select((i - 1 + tabs.length) % tabs.length);\n  });\n});\n';
const accJs = 'const buttons = [...document.querySelectorAll(".item button")];\nfor (const button of buttons) {\n  button.addEventListener("click", () => {\n    const wasOpen = button.getAttribute("aria-expanded") === "true";\n    for (const b of buttons) {\n      b.setAttribute("aria-expanded", "false");\n      b.nextElementSibling.hidden = true;\n    }\n    if (!wasOpen) {\n      button.setAttribute("aria-expanded", "true");\n      button.nextElementSibling.hidden = false;\n    }\n  });\n}\n';
const totalJs = 'const rows = [...document.querySelectorAll("tr[data-price]")];\nconst money = (cents) => "£" + (cents / 100).toFixed(2);\nfunction update() {\n  let cents = 0;\n  for (const row of rows) {\n    const raw = row.querySelector(".qty").value.trim();\n    const qty = raw === "" ? 0 : Number(raw);\n    if (Number.isInteger(qty) && qty > 0) cents += qty * Math.round(Number(row.dataset.price) * 100);\n  }\n  const discount = cents >= 10000 ? Math.round(cents * 0.1) : 0;\n  document.querySelector("#subtotal").textContent = money(cents);\n  document.querySelector("#discount").textContent = money(discount);\n  document.querySelector("#total").textContent = money(cents - discount);\n}\nfor (const input of document.querySelectorAll(".qty")) input.addEventListener("input", update);\nupdate();\n';
const themeJs = 'const button = document.querySelector("#theme");\nfunction apply(dark) {\n  document.body.classList.toggle("dark", dark);\n  button.textContent = dark ? "Light mode" : "Dark mode";\n}\nlet dark = false;\ntry {\n  dark = localStorage.getItem("theme") === "dark";\n} catch {}\napply(dark);\nbutton.addEventListener("click", () => {\n  dark = !dark;\n  localStorage.setItem("theme", dark ? "dark" : "light");\n  apply(dark);\n});\n';
const topJs = 'const state = document.querySelector("#state");\nconst list = document.querySelector("#top");\nasync function load() {\n  state.textContent = "Loading...";\n  const response = await fetch("/api/players?sort=-home_runs&limit=3");\n  if (!response.ok) {\n    state.textContent = "Leaders unavailable";\n    return;\n  }\n  const players = await response.json();\n  state.textContent = "";\n  for (const p of players) {\n    const li = document.createElement("li");\n    li.textContent = `${p.name} (${p.team}): ${p.home_runs}`;\n    list.append(li);\n  }\n}\nload();\n';
const stockJs = 'const state = document.querySelector("#state");\nconst list = document.querySelector("#stock");\nconst count = document.querySelector("#low-count");\nasync function load() {\n  state.textContent = "Loading...";\n  const response = await fetch("/api/products");\n  if (!response.ok) {\n    state.textContent = "Stock unavailable";\n    return;\n  }\n  const products = await response.json();\n  state.textContent = "";\n  let low = 0;\n  for (const p of products) {\n    const li = document.createElement("li");\n    li.textContent = `${p.name}: ${p.stock}`;\n    if (p.stock < 10) {\n      li.classList.add("low");\n      low++;\n    }\n    list.append(li);\n  }\n  count.textContent = `${low} low`;\n}\nload();\n';
const stockCss = '.low { color: #b00020; }\n';
const checkJs = 'const status = document.querySelector("#status");\ndocument.querySelector("#check").addEventListener("click", async () => {\n  status.textContent = "Checking...";\n  for (let i = 0; i < 3; i++) {\n    const response = await fetch("/api/flaky");\n    if (response.ok) {\n      status.textContent = "Online";\n      return;\n    }\n  }\n  status.textContent = "Offline";\n});\n';
const joinJs = 'const msg = document.querySelector("#msg");\nconst list = document.querySelector("#teams");\nconst nameBox = document.querySelector("#name");\nconst cityBox = document.querySelector("#city");\ndocument.querySelector("#join").addEventListener("submit", async (event) => {\n  event.preventDefault();\n  const name = nameBox.value.trim();\n  const city = cityBox.value.trim();\n  if (!name || !city) {\n    msg.textContent = "Name and city are required";\n    return;\n  }\n  const response = await fetch("/api/teams", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ name, city }),\n  });\n  const data = await response.json();\n  if (response.status !== 201) {\n    msg.textContent = `The server refused: ${data.error}`;\n    return;\n  }\n  msg.textContent = `Joined ${data.name} (team ${data.id})`;\n  const li = document.createElement("li");\n  li.textContent = `${data.name}, ${city}`;\n  list.append(li);\n  nameBox.value = "";\n  cityBox.value = "";\n});\n';

export const webDailySolutions: Record<string, Sol> = {
  'daily-web-status-page': {
    valid: [F(statusHtml)],
    wrong: [
      F(statusHtml.replace(/ scope="col"/g, '')),
      F(statusHtml.replace('<caption>Machines today</caption>', '')),
      F(statusHtml.replace('<h1>Line 3 Status</h1>', '<h2>Line 3 Status</h2>')),
      F(statusHtml.replace(' lang="en"', '')),
      F(statusHtml.replace('<td>Lathe</td><td>idle</td><td>0</td>', '<td>Lathe</td><td>idle</td><td>1</td>')),
      F(statusHtml.replace('<thead><tr><th scope="col">Machine</th><th scope="col">State</th><th scope="col">Output</th></tr></thead>', '<tr><td>Machine</td><td>State</td><td>Output</td></tr>')),
      F(statusHtml.replace('<p>Live figures for the machines on Line 3.</p>\n', '')),
    ],
  },
  'daily-web-signup-rules': {
    valid: [F(signup)],
    wrong: [
      F(signup.replace('<input id="e" type="email" required>', '<input id="e" type="email">')),
      F(signup.replace('type="email"', 'type="text"')),
      F(signup.replace('min="18"', 'min="17"')),
      F(signup.replace('max="65"', 'max="66"')),
      F(signup.replace(' step="1"', ' step="0.5"')),
      F(signup.replace(' required minlength="3" maxlength="12" pattern="[A-Za-z0-9]{3,12}"', ' required maxlength="12"')),
      F(signup.replace('[A-Za-z0-9]{3,12}', '[A-Za-z0-9_-]{3,12}')),
      F(signup.replace(' minlength="3"', '').replace('pattern="[A-Za-z0-9]{3,12}"', 'pattern="[A-Za-z0-9]+"')),
      F(signup.replace('<input type="checkbox" required>', '<input type="checkbox">')),
      F(signup.replace('<label for="a">Age</label> ', '')),
    ],
  },
  'daily-web-badge-row': {
    valid: [F(HTMLS.badges, badgeCss)],
    wrong: [
      F(HTMLS.badges, badgeCss.replace('gap: 8px', 'gap: 10px')),
      F(HTMLS.badges, badgeCss.replace('padding: 6px 14px', 'padding: 14px 6px')),
      F(HTMLS.badges, badgeCss.replace('border-radius: 999px', 'border-radius: 4px')),
      F(HTMLS.badges, badgeCss.replace('font-weight: bold; ', '')),
      F(HTMLS.badges, badgeCss.replace('#b57600', '#ffbf00')),
      F(HTMLS.badges, badgeCss.replace('display: flex; gap: 8px; flex-wrap: nowrap;', 'display: flex; gap: 8px; flex-wrap: wrap;').replace('white-space: nowrap;', '').replace('padding: 6px 14px', 'padding: 6px 14px; min-width: 120px')),
      F(HTMLS.badges, badgeCss.replace('font-size: 14px', 'font-size: 16px')),
    ],
  },
  'daily-web-two-column': {
    valid: [F(HTMLS.twoCol, twoColCss)],
    wrong: [
      F(HTMLS.twoCol, twoColCss.replace('@media (max-width: 699px)', '@media (max-width: 700px)')),
      F(HTMLS.twoCol, twoColCss.replace('@media (max-width: 699px)', '@media (max-width: 600px)')),
      F(HTMLS.twoCol, twoColCss.replace('width: 240px; flex: none;', 'width: 25%;')),
      F(HTMLS.twoCol, twoColCss.replace('gap: 20px', 'gap: 16px')),
      F(HTMLS.twoCol, twoColCss.replace('* { box-sizing: border-box; }\n', '')),
      F(HTMLS.twoCol, twoColCss.replace('flex: 1; ', 'width: 400px; ')),
      F(HTMLS.twoCol, twoColCss.replace('  .layout { flex-direction: column; }\n', '')),
      F(HTMLS.twoCol, twoColCss.replace('background: #f2f5fa', 'background: #eeeeee')),
    ],
  },
  'daily-web-card-columns': {
    valid: [F(HTMLS.cards, cardCss), F(HTMLS.cards, '* { box-sizing: border-box; }\nbody { margin: 0; }\n.cards { display: grid; gap: 16px; padding: 16px; grid-template-columns: 1fr; }\n.card { min-height: 80px; }\n@media (min-width: 600px) { .cards { grid-template-columns: 1fr 1fr; } }\n@media (min-width: 900px) { .cards { grid-template-columns: 1fr 1fr 1fr; } }\n')],
    wrong: [
      F(HTMLS.cards, cardCss.replace('min-width: 900px', 'min-width: 901px')),
      F(HTMLS.cards, cardCss.replace('min-width: 600px', 'min-width: 601px')),
      F(HTMLS.cards, cardCss.replace('gap: 16px', 'gap: 12px')),
      F(HTMLS.cards, cardCss.replace('padding: 16px', 'padding: 0')),
      F(HTMLS.cards, cardCss.replace('min-height: 80px', 'min-height: 40px')),
      F(HTMLS.cards, cardCss.replace('* { box-sizing: border-box; }\n', '').replace('.card { min-height: 80px;', '.card { padding: 20px; width: 100%; min-height: 80px;')),
      F(HTMLS.cards, cardCss.replace('@media (min-width: 900px) { .cards { grid-template-columns: repeat(3, 1fr); } }\n', '')),
      F(HTMLS.cards, cardCss.replace('repeat(3, 1fr)', '200px 1fr 1fr')),
    ],
  },
  'daily-js-median': {
    valid: [J(median), J('const median = (n) => {\n  if (!n.length) return null;\n  const s = n.slice().sort((a, b) => a - b);\n  const h = s.length >> 1;\n  return s.length & 1 ? s[h] : (s[h - 1] + s[h]) / 2;\n};\n')],
    wrong: [
      J(repJ(median, '(a, b) => a - b', '')),
      J(repJ(median, '[...numbers].sort', 'numbers.sort')),
      J(repJ(median, 'return null', 'return 0')),
      J(repJ(median, '(sorted[mid - 1] + sorted[mid]) / 2', 'sorted[mid]')),
      J(repJ(median, 'sorted.length % 2 ? sorted[mid]', 'sorted.length % 2 ? sorted[mid - 1]')),
    ],
  },
  'daily-js-sum-by': {
    valid: [J(sumBy)],
    wrong: [
      J(repJ(sumBy, 'Math.round(value * 100)', 'value * 100')),
      J(repJ(sumBy, '    if (typeof value !== "number" || !Number.isFinite(value)) continue;\n', '    if (typeof value !== "number") continue;\n')),
      J(repJ(sumBy, '    if (typeof value !== "number" || !Number.isFinite(value)) continue;\n', '    if (typeof value !== "number" || !Number.isFinite(value)) { cents[item[key]] = cents[item[key]] || 0; continue; }\n')),
      J(repJ(sumBy, 'const value = item[valueKey];', 'const value = Number(item[valueKey]);')),
      J(repJ(sumBy, 'cents[k] / 100', 'Math.round(cents[k]) / 10')),
    ],
  },
  'daily-js-slugify': {
    valid: [J(slugify)],
    wrong: [
      J(repJ(slugify, '.replace(/^-+|-+$/g, "")', '')),
      J(repJ(slugify, '[^a-z0-9]+', '[^a-z0-9]')),
      J(repJ(slugify, '.toLowerCase().trim()', '.trim()')),
      J(repJ(slugify, '[^a-z0-9]+', '\\W+')),
    ],
  },
  'daily-js-parse-duration': {
    valid: [J(duration)],
    wrong: [
      J(repJ(duration, '  if (!m || (!m[1] && !m[2])) return null;\n', '  if (!m) return null;\n')),
      J(repJ(duration, 'text.trim()', 'text')),
      J(repJ(duration, '\\s*(?:', '\\s+(?:')),
      J(repJ(duration, '(\\d+)h', '(\\d+(?:\\.\\d+)?)h')),
      J(repJ(duration, '\\d+)m)?$/', '\\d{1,2})m)?$/')),
      J(repJ(duration, 'Number(m[1] || 0) * 60', 'Number(m[1] || 0) * 100')),
    ],
  },
  'daily-js-latest-per-id': {
    valid: [J(latest)],
    wrong: [
      J(repJ(latest, 'r.updated >= current.updated', 'r.updated > current.updated')),
      J(repJ(latest, 'r.updated >= current.updated', 'true')),
      J(repJ(latest, '.sort((a, b) => a.id - b.id)', '')),
      J(repJ(latest, '.sort((a, b) => a.id - b.id)', '.sort((a, b) => String(a.id).localeCompare(String(b.id)))')),
      J('function latestPerId(records) {\n  return records.sort((a, b) => a.id - b.id || (a.updated < b.updated ? 1 : -1)).filter((r, i, a) => i === 0 || a[i - 1].id !== r.id);\n}\n'),
    ],
  },
  'daily-js-first-success': {
    valid: [J(firstSuccess)],
    wrong: [
      J('function firstSuccess(tasks) {\n  return Promise.race(tasks.map((t) => t()));\n}\n'),
      J('function firstSuccess(tasks) {\n  return Promise.any(tasks.map((t) => t())).catch(() => { throw new Error("nope"); });\n}\n'),
      J(repJ(firstSuccess, '    if (tasks.length === 0) reject(new Error("all failed"));\n', '')),
      J(repJ(firstSuccess, 'failed === tasks.length', 'failed >= 1')),
      J('async function firstSuccess(tasks) {\n  for (const t of tasks) {\n    try {\n      return await t();\n    } catch {}\n  }\n  throw new Error("all failed");\n}\n'),
      J(repJ(firstSuccess, '.then(task)', '.then(() => task)')),
    ],
  },
  'daily-js-debounce': {
    valid: [J(debounce)],
    wrong: [
      J(repJ(debounce, '    clearTimeout(timer);\n', '')),
      J(repJ(debounce, '(...args) => {', '() => {').replace('fn(...args)', 'fn()')),
      J('function debounce(fn, ms) {\n  let last = 0;\n  return (...args) => {\n    const now = Date.now();\n    if (now - last >= ms) fn(...args);\n    last = now;\n  };\n}\n'),
      J('let timer;\nfunction debounce(fn, ms) {\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n'),
      J(repJ(debounce, 'timer = setTimeout(() => fn(...args), ms);', 'timer = setTimeout(() => fn(args[0]), ms);')),
    ],
  },
  'daily-web-tabs': {
    valid: [J(tabsJs, HTMLS.tabs)],
    wrong: [
      J(repJ(tabsJs, '    document.getElementById(tab.dataset.panel).hidden = i !== index;\n', ''), HTMLS.tabs),
      J(repJ(tabsJs, '    tab.setAttribute("aria-selected", String(i === index));\n', ''), HTMLS.tabs),
      J(repJ(tabsJs, '(i + 1) % tabs.length', 'Math.min(i + 1, tabs.length - 1)'), HTMLS.tabs),
      J(repJ(tabsJs, '(i - 1 + tabs.length) % tabs.length', 'Math.max(i - 1, 0)'), HTMLS.tabs),
      J(repJ(tabsJs, 'if (event.key === "ArrowLeft")', 'if (event.key !== "ArrowRight")'), HTMLS.tabs),
      J('const tabs = [...document.querySelectorAll("[role=tab]")];\ntabs.forEach((tab) => tab.addEventListener("click", () => {\n  tabs.forEach((t) => t.setAttribute("aria-selected", "false"));\n  tab.setAttribute("aria-selected", "true");\n  for (const p of document.querySelectorAll("[role=tabpanel]")) p.hidden = p.id !== tab.dataset.panel;\n}));\n', HTMLS.tabs),
    ],
  },
  'daily-web-accordion': {
    valid: [J(accJs, HTMLS.accordion)],
    wrong: [
      J(repJ(accJs, '    for (const b of buttons) {\n      b.setAttribute("aria-expanded", "false");\n      b.nextElementSibling.hidden = true;\n    }\n', ''), HTMLS.accordion),
      J(repJ(accJs, '    if (!wasOpen) {', '    if (true) {'), HTMLS.accordion),
      J(repJ(accJs, '      button.setAttribute("aria-expanded", "true");\n', ''), HTMLS.accordion),
      J(repJ(accJs, '      button.nextElementSibling.hidden = false;\n', ''), HTMLS.accordion),
      J('for (const b of document.querySelectorAll(".item button")) b.addEventListener("click", () => {\n  const open = b.getAttribute("aria-expanded") === "true";\n  b.setAttribute("aria-expanded", String(!open));\n  b.nextElementSibling.hidden = open;\n});\n', HTMLS.accordion),
    ],
  },
  'daily-web-live-total': {
    valid: [J(totalJs, HTMLS.order)],
    wrong: [
      J(repJ(totalJs, 'cents >= 10000', 'cents >= 9975'), HTMLS.order),
      J(repJ(totalJs, 'Number.isInteger(qty) && qty > 0', 'qty > 0'), HTMLS.order),
      J(repJ(totalJs, 'Number.isInteger(qty) && qty > 0', 'Number.isInteger(qty)'), HTMLS.order),
      J(repJ(totalJs, '.toFixed(2)', '.toFixed(1)'), HTMLS.order),
      J(repJ(totalJs, 'input.addEventListener("input", update);\nupdate();\n', 'input.addEventListener("input", update);\n'), HTMLS.order),
      J(repJ(totalJs, 'cents - discount', 'cents'), HTMLS.order),
      J(repJ(totalJs, 'Math.round(cents * 0.1)', 'Math.round(cents * 0.15)'), HTMLS.order),
    ],
  },
  'daily-web-theme-memory': {
    valid: [F(HTMLS.theme, '.dark { background: #111; color: #eee; }\n', themeJs)],
    wrong: [
      F(HTMLS.theme, '', repJ(themeJs, '  localStorage.setItem("theme", dark ? "dark" : "light");\n', '')),
      F(HTMLS.theme, '', repJ(themeJs, 'dark = localStorage.getItem("theme") === "dark";', 'dark = false;')),
      F(HTMLS.theme, '', repJ(themeJs, '  button.textContent = dark ? "Light mode" : "Dark mode";\n', '')),
      F(HTMLS.theme, '', repJ(themeJs, 'localStorage.getItem("theme") === "dark"', 'localStorage.getItem("theme") !== null')),
      F(HTMLS.theme, '', repJ(themeJs, 'localStorage.setItem("theme", dark ? "dark" : "light");', 'localStorage.setItem("theme", "x");')),
    ],
  },
  'daily-web-top-hitters': {
    valid: [J(topJs, HTMLS.top), J(topJs.replace('/api/players?sort=-home_runs&limit=3', '/api/players').replace('const players = await response.json();', 'const players = (await response.json()).sort((a, b) => b.home_runs - a.home_runs).slice(0, 3);'), HTMLS.top)],
    wrong: [
      J(repJ(topJs, '?sort=-home_runs&limit=3', '?sort=home_runs&limit=3'), HTMLS.top),
      J(repJ(topJs, '&limit=3', '&limit=5'), HTMLS.top),
      J(repJ(topJs, '  state.textContent = "Loading...";\n', ''), HTMLS.top),
      J(repJ(topJs, '  if (!response.ok) {\n    state.textContent = "Leaders unavailable";\n    return;\n  }\n', ''), HTMLS.top),
      J(repJ(topJs, '  state.textContent = "";\n  for', '  for'), HTMLS.top),
      J(repJ(topJs, '${p.name} (${p.team}): ${p.home_runs}', '${p.name} (${p.team}) ${p.home_runs}'), HTMLS.top),
    ],
  },
  'daily-web-low-stock': {
    valid: [F(HTMLS.stock, stockCss, stockJs)],
    wrong: [
      F(HTMLS.stock, stockCss, repJ(stockJs, 'p.stock < 10', 'p.stock <= 10')),
      F(HTMLS.stock, stockCss, repJ(stockJs, 'p.stock < 10', 'p.stock < 5')),
      F(HTMLS.stock, '', stockJs),
      F(HTMLS.stock, '.low, li { color: #b00020; }', stockJs),
      F(HTMLS.stock, stockCss, repJ(stockJs, '  count.textContent = `${low} low`;\n', '')),
      F(HTMLS.stock, stockCss, repJ(stockJs, '  if (!response.ok) {\n    state.textContent = "Stock unavailable";\n    return;\n  }\n', '')),
      F(HTMLS.stock, stockCss, repJ(stockJs, '      li.classList.add("low");\n', '      li.style.color = "#b00020";\n')),
    ],
  },
  'daily-web-service-check': {
    valid: [J(checkJs, HTMLS.online)],
    wrong: [
      J(repJ(checkJs, 'i < 3', 'i < 2'), HTMLS.online),
      J(repJ(checkJs, 'i < 3', 'i < 4'), HTMLS.online),
      J(repJ(checkJs, '      status.textContent = "Online";\n      return;\n', '      status.textContent = "Online";\n'), HTMLS.online),
      J(repJ(checkJs, '  status.textContent = "Checking...";\n', ''), HTMLS.online),
      J(repJ(checkJs, '  status.textContent = "Offline";\n', ''), HTMLS.online),
      J('document.querySelector("#check").addEventListener("click", async () => {\n  const s = document.querySelector("#status");\n  s.textContent = "Checking...";\n  const r = await fetch("/api/flaky");\n  s.textContent = r.ok ? "Online" : "Offline";\n});\n', HTMLS.online),
    ],
  },
  'daily-web-join-team': {
    valid: [J(joinJs, HTMLS.join)],
    wrong: [
      J(repJ(joinJs, '  event.preventDefault();\n', ''), HTMLS.join),
      J(repJ(joinJs, '  if (!name || !city) {\n    msg.textContent = "Name and city are required";\n    return;\n  }\n', ''), HTMLS.join),
      J(repJ(joinJs, '  if (!name || !city) {', '  if (!name && !city) {'), HTMLS.join),
      J(repJ(joinJs, '    headers: { "Content-Type": "application/json" },\n', ''), HTMLS.join),
      J(repJ(joinJs, 'response.status !== 201', 'false'), HTMLS.join),
      J(repJ(joinJs, '  nameBox.value = "";\n  cityBox.value = "";\n', ''), HTMLS.join),
      J(repJ(joinJs, '(team ${data.id})', '(team 1)'), HTMLS.join),
      J(repJ(joinJs, 'const name = nameBox.value.trim();', 'const name = nameBox.value;'), HTMLS.join),
    ],
  },
};
