import type { Sol } from './solutions.testdata';
import { fj } from './solutions.js';
import { formsHtml } from './20-forms-js';

/** Solutions for the application-building JavaScript lessons (forms, storage, async, fetch, projects). */
export const appSolutions: Record<string, Sol> = {};
const { SIGNUP_HTML, ORDER_HTML, SENSOR_HTML, CONTACT_HTML } = formsHtml;

const write = 'for (const [field, message] of Object.entries(errors)) document.querySelector(`#${field}-error`).textContent = message;\n';
const wrap = (id: string, body: string) => `document.querySelector("#${id}").addEventListener("submit", (event) => {\n  event.preventDefault();\n${body}});\n`;
const val = (id: string) => `document.querySelector("#${id}").value`;

const contactJs = wrap('contact', `  const name = ${val('name')}.trim();\n  const message = ${val('message')}.trim();\n  const errors = {\n    name: name === "" ? "Name is required" : "",\n    message: message.length < 10 ? "Message is too short" : "",\n  };\n  ${write}  const ok = Object.values(errors).every((m) => m === "");\n  document.querySelector("#result").textContent = ok ? \`Sent, \${name}\` : "";\n`);
const signupJs = wrap('signup', `  const email = ${val('email')}.trim();\n  const password = ${val('password')};\n  const confirm = ${val('confirm')};\n  const errors = {\n    email: /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email) ? "" : "Enter a valid email",\n    password: password.length >= 8 && /\\d/.test(password) ? "" : "At least 8 characters with a number",\n    confirm: confirm === password ? "" : "Passwords must match",\n  };\n  ${write}  const ok = Object.values(errors).every((m) => m === "");\n  document.querySelector("#result").textContent = ok ? \`Welcome, \${email}\` : "";\n`);
const orderJs = wrap('order', `  const name = ${val('name')}.trim();\n  const qtyText = ${val('qty')}.trim();\n  const code = ${val('code')}.trim();\n  const qty = Number(qtyText);\n  const errors = {\n    name: name === "" ? "Name is required" : "",\n    qty: qtyText !== "" && Number.isInteger(qty) && qty >= 1 && qty <= 99 ? "" : "Quantity must be a whole number from 1 to 99",\n    code: code === "" || /^[A-Z]{3}-\\d{2}$/.test(code) ? "" : "Code looks like ABC-12",\n  };\n  ${write}  const ok = Object.values(errors).every((m) => m === "");\n  document.querySelector("#result").textContent = ok ? \`Ordered \${qty} for \${name}\` : "";\n`);
const sensorJs = wrap('reading', `  const sensor = ${val('sensor')}.trim();\n  const raw = ${val('value')}.trim();\n  const value = Number(raw);\n  const note = ${val('note')}.trim();\n  const errors = {\n    sensor: /^S-\\d{3}$/.test(sensor) ? "" : "Sensor looks like S-123",\n    value: raw !== "" && Number.isFinite(value) && value >= -50 && value <= 150 ? "" : "Reading must be from -50 to 150",\n    note: note.length <= 40 ? "" : "Note is too long (max 40)",\n  };\n  ${write}  const ok = Object.values(errors).every((m) => m === "");\n  document.querySelector("#result").textContent = ok ? \`Logged \${sensor}: \${value}\` : "";\n`);
const noteJs = 'const note = document.querySelector("#note");\nconst left = document.querySelector("#left");\nconst send = document.querySelector("#send");\nfunction render() {\n  const length = note.value.length;\n  left.textContent = `${80 - length} left`;\n  left.classList.toggle("over", length > 80);\n  send.disabled = note.value.trim() === "" || length > 80;\n}\nnote.addEventListener("input", render);\nrender();\n';
const userJs = 'const user = document.querySelector("#user");\nconst hint = document.querySelector("#hint");\nconst join = document.querySelector("#join");\nfunction check(name) {\n  if (name === "") return "";\n  if (!/^\\w+$/.test(name)) return "Letters, numbers and _ only";\n  if (name.length < 3) return "Too short";\n  if (name.length > 12) return "Too long";\n  if (["admin", "root", "system"].includes(name.toLowerCase())) return "Taken";\n  return "Available";\n}\nuser.addEventListener("input", () => {\n  const message = check(user.value);\n  hint.textContent = message;\n  hint.classList.toggle("ok", message === "Available");\n  join.disabled = message !== "Available";\n});\n';

const rep = (js: string, from: string | RegExp, to: string) => {
  const out = js.replace(from, to);
  if (out === js) throw new Error('solutions.app: replacement did nothing: ' + String(from));
  return out;
};

Object.assign(appSolutions, {
  'web-20-contact-form': {
    valid: [fj(contactJs, CONTACT_HTML)],
    wrong: [fj(rep(contactJs, '  event.preventDefault();\n', ''), CONTACT_HTML), fj(rep(contactJs, '.trim();\n  const message', ';\n  const message'), CONTACT_HTML), fj(rep(contactJs, 'message.length < 10', 'message.length <= 10'), CONTACT_HTML), fj(rep(contactJs, 'ok ? `Sent, ${name}` : ""', '`Sent, ${name}`'), CONTACT_HTML)],
  },
  'web-20-signup-form': {
    valid: [fj(signupJs, SIGNUP_HTML), fj(rep(signupJs, '/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)', '(email.split("@").length === 2 && !email.includes(" ") && email.split("@")[0].length > 0 && email.split("@")[1].includes(".") && email.split("@")[1].length > 2)'), SIGNUP_HTML)],
    wrong: [
      fj(rep(signupJs, '  event.preventDefault();\n', ''), SIGNUP_HTML),
      fj(rep(signupJs, '/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)', 'email.includes("@")'), SIGNUP_HTML),
      fj(rep(signupJs, 'password.length >= 8', 'password.length > 8'), SIGNUP_HTML),
      fj(rep(signupJs, ' && /\\d/.test(password)', ''), SIGNUP_HTML),
      fj(rep(signupJs, 'confirm === password ? "" : "Passwords must match"', '""'), SIGNUP_HTML),
      fj(rep(signupJs, 'const email = document.querySelector("#email").value.trim();', 'const email = document.querySelector("#email").value;'), SIGNUP_HTML),
      fj(rep(signupJs, '  ${write}'.replace('${write}', write), '  for (const [field, message] of Object.entries(errors)) if (message) document.querySelector(`#${field}-error`).textContent = message;\n'), SIGNUP_HTML),
      fj(rep(signupJs, 'ok ? `Welcome, ${email}` : ""', '`Welcome, ${email}`'), SIGNUP_HTML),
    ],
  },
  'web-20-order-form': {
    valid: [fj(orderJs, ORDER_HTML)],
    wrong: [
      fj(rep(orderJs, '  event.preventDefault();\n', ''), ORDER_HTML),
      fj(rep(orderJs, 'Number.isInteger(qty) && ', ''), ORDER_HTML),
      fj(rep(orderJs, 'qty <= 99', 'qty < 99'), ORDER_HTML),
      fj(rep(orderJs, 'qty >= 1', 'qty > 1'), ORDER_HTML),
      fj(rep(orderJs, 'code === "" || ', ''), ORDER_HTML),
      fj(rep(orderJs, '[A-Z]{3}', '[A-Za-z]{3}'), ORDER_HTML),
      fj(rep(orderJs, 'name === ""', 'name.length < 0'), ORDER_HTML),
    ],
  },
  'web-20-sensor-form': {
    valid: [fj(sensorJs, SENSOR_HTML)],
    wrong: [
      fj(rep(sensorJs, '  event.preventDefault();\n', ''), SENSOR_HTML),
      fj(rep(sensorJs, 'raw !== "" && ', ''), SENSOR_HTML),
      fj(rep(sensorJs, 'value <= 150', 'value < 150'), SENSOR_HTML),
      fj(rep(sensorJs, 'value >= -50', 'value > -50'), SENSOR_HTML),
      fj(rep(sensorJs, '\\d{3}$/', '\\d+$/'), SENSOR_HTML),
      fj(rep(sensorJs, 'note.length <= 40', 'note.length < 40'), SENSOR_HTML),
      fj(rep(sensorJs, 'Logged ${sensor}: ${value}', 'Logged ${sensor}: ${raw}'), SENSOR_HTML),
    ],
  },
  'web-20-note-counter': {
    valid: [fj(noteJs, '<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n')],
    wrong: [
      fj(rep(noteJs, 'length > 80);\n  send', 'length >= 80);\n  send'), '<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n'),
      fj(rep(noteJs, 'note.value.trim() === "" || ', ''), '<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n'),
      fj(rep(noteJs, '80 - length', '80 - note.value.trim().length'), '<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n'),
      fj(rep(noteJs, ' || length > 80;', ';'), '<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n'),
      fj(rep(noteJs, 'left.classList.toggle("over", length > 80);', 'if (length > 80) left.classList.add("over");'), '<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n'),
    ],
  },
  'web-20-username-check': {
    valid: [fj(userJs, '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n')],
    wrong: [
      fj(rep(userJs, 'name.length < 3', 'name.length < 4'), '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n'),
      fj(rep(userJs, 'name.length > 12', 'name.length >= 12'), '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n'),
      fj(rep(userJs, 'name.toLowerCase()', 'name'), '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n'),
      fj(rep(userJs, '  if (!/^\\w+$/.test(name)) return "Letters, numbers and _ only";\n  if (name.length < 3) return "Too short";', '  if (name.length < 3) return "Too short";\n  if (!/^\\w+$/.test(name)) return "Letters, numbers and _ only";'), '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n'),
      fj(rep(userJs, '  join.disabled = message !== "Available";\n', ''), '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n'),
      fj(rep(userJs, 'hint.classList.toggle("ok", message === "Available");', 'hint.classList.add("ok");'), '<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n'),
    ],
  },
} satisfies Record<string, Sol>);

/* ------------------------------------------------------------ lesson 21: storage and JSON */
import { HTML as H21 } from './21-storage-json';

const nameJs = 'const input = document.querySelector("#name");\nconst greeting = document.querySelector("#greeting");\ngreeting.textContent = "Hello, " + (localStorage.getItem("name") || "stranger");\ndocument.querySelector("#save").addEventListener("click", () => {\n  const name = input.value.trim();\n  localStorage.setItem("name", name);\n  greeting.textContent = "Hello, " + name;\n});\n';
const settingsJs = 'const dark = document.querySelector("#dark");\nconst size = document.querySelector("#size");\nconst SIZES = ["small", "medium", "large"];\n\nfunction load() {\n  try {\n    const saved = JSON.parse(localStorage.getItem("settings"));\n    return { dark: saved?.dark === true, size: SIZES.includes(saved?.size) ? saved.size : "medium" };\n  } catch {\n    return { dark: false, size: "medium" };\n  }\n}\nfunction apply() {\n  document.body.classList.toggle("dark", dark.checked);\n  document.body.dataset.size = size.value;\n}\nfunction save() {\n  localStorage.setItem("settings", JSON.stringify({ dark: dark.checked, size: size.value }));\n}\n\nconst start = load();\ndark.checked = start.dark;\nsize.value = start.size;\napply();\nfor (const control of [dark, size]) {\n  control.addEventListener("change", () => {\n    apply();\n    save();\n  });\n}\n';
const cartJs = 'const KEY = "cart";\nconst counter = document.querySelector("#count");\n\nfunction load() {\n  try {\n    const data = JSON.parse(localStorage.getItem(KEY));\n    if (!Array.isArray(data)) return [];\n    return data.filter((i) => i && typeof i.sku === "string" && i.sku !== "" && Number.isInteger(i.qty) && i.qty >= 1).map((i) => ({ sku: i.sku, qty: i.qty }));\n  } catch {\n    return [];\n  }\n}\nlet cart = load();\n\nfunction update() {\n  localStorage.setItem(KEY, JSON.stringify(cart));\n  counter.textContent = cart.reduce((sum, i) => sum + i.qty, 0);\n}\nfor (const button of document.querySelectorAll(".add")) {\n  button.addEventListener("click", () => {\n    const sku = button.dataset.sku;\n    const line = cart.find((i) => i.sku === sku);\n    if (line) line.qty++;\n    else cart.push({ sku, qty: 1 });\n    update();\n  });\n}\ndocument.querySelector("#clear").addEventListener("click", () => {\n  cart = [];\n  update();\n});\nupdate();\n';
const recentJs = 'const box = document.querySelector("#q");\nconst list = document.querySelector("#recent");\n\nfunction load() {\n  try {\n    const data = JSON.parse(localStorage.getItem("recent"));\n    return Array.isArray(data) ? data.filter((x) => typeof x === "string" && x !== "").slice(0, 5) : [];\n  } catch {\n    return [];\n  }\n}\nlet recent = load();\n\nfunction update() {\n  localStorage.setItem("recent", JSON.stringify(recent));\n  list.replaceChildren();\n  for (const term of recent) {\n    const li = document.createElement("li");\n    li.textContent = term;\n    list.append(li);\n  }\n}\ndocument.querySelector("#go").addEventListener("click", () => {\n  const term = box.value.trim();\n  if (term === "") return;\n  recent = [term, ...recent.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);\n  box.value = "";\n  update();\n});\ndocument.querySelector("#wipe").addEventListener("click", () => {\n  recent = [];\n  update();\n});\nupdate();\n';
const configJs = 'function readConfig(text) {\n  const defaults = { retries: 3, timeout: 30, name: "job" };\n  let data;\n  try {\n    data = JSON.parse(text);\n  } catch {\n    return defaults;\n  }\n  if (data === null || typeof data !== "object" || Array.isArray(data)) return defaults;\n  const retries = Number.isInteger(data.retries) && data.retries >= 0 && data.retries <= 10 ? data.retries : defaults.retries;\n  const timeout = typeof data.timeout === "number" && data.timeout > 0 ? data.timeout : defaults.timeout;\n  const name = typeof data.name === "string" && data.name.trim() !== "" ? data.name.trim() : defaults.name;\n  return { retries, timeout, name };\n}\n';
const rosterJs = 'function readRoster(text) {\n  let data;\n  try {\n    data = JSON.parse(text);\n  } catch {\n    return [];\n  }\n  if (!Array.isArray(data)) return [];\n  const roster = [];\n  for (const p of data) {\n    if (p && typeof p.name === "string" && p.name.trim() !== "" && Number.isInteger(p.age) && p.age >= 0 && p.age <= 120) {\n      roster.push({ name: p.name.trim(), age: p.age });\n    }\n  }\n  return roster;\n}\n';

Object.assign(appSolutions, {
  'web-21-saved-name': {
    valid: [fj(nameJs, H21.name)],
    wrong: [fj(rep(nameJs, '.trim();\n  localStorage', ';\n  localStorage'), H21.name), fj(rep(nameJs, 'localStorage.setItem("name", name);\n', ''), H21.name), fj(rep(nameJs, 'greeting.textContent = "Hello, " + (localStorage.getItem("name") || "stranger");\n', ''), H21.name), fj(rep(nameJs, ' || "stranger"', ''), H21.name), fj(rep(nameJs, 'localStorage.setItem("name"', 'localStorage.setItem("user"'), H21.name)],
  },
  'web-21-settings-panel': {
    valid: [fj(settingsJs, H21.settings, '.dark { background: #222; color: #eee; }\n')],
    wrong: [
      fj(rep(settingsJs, 'saved?.dark === true', 'Boolean(saved?.dark)'), H21.settings),
      fj(rep(settingsJs, 'SIZES.includes(saved?.size) ? saved.size : "medium"', 'saved?.size ?? "medium"'), H21.settings),
      fj(rep(settingsJs, '  } catch {\n    return { dark: false, size: "medium" };\n  }', '  } finally {\n  }'), H21.settings),
      fj(rep(settingsJs, 'dark.checked = start.dark;\n', ''), H21.settings),
      fj(rep(settingsJs, 'size.value = start.size;\n', ''), H21.settings),
      fj(rep(settingsJs, 'apply();\nfor', 'for'), H21.settings),
      fj(rep(settingsJs, '    save();\n', ''), H21.settings),
      fj(rep(settingsJs, 'JSON.stringify({ dark: dark.checked, size: size.value })', 'JSON.stringify({ dark: dark.checked })'), H21.settings),
    ],
  },
  'web-21-cart-storage': {
    valid: [fj(cartJs, H21.cart)],
    wrong: [
      fj(rep(cartJs, '.filter((i) => i && typeof i.sku === "string" && i.sku !== "" && Number.isInteger(i.qty) && i.qty >= 1)', ''), H21.cart),
      fj(rep(cartJs, 'Number.isInteger(i.qty) && ', ''), H21.cart),
      fj(rep(cartJs, ' && i.qty >= 1', ''), H21.cart),
      fj(rep(cartJs, '  } catch {\n    return [];\n  }', '  } finally {\n  }\n  return [];'), H21.cart),
      fj(rep(cartJs, 'if (line) line.qty++;\n    else cart.push({ sku, qty: 1 });', 'cart.push({ sku, qty: 1 });'), H21.cart),
      fj(rep(cartJs, 'counter.textContent = cart.reduce((sum, i) => sum + i.qty, 0);', 'counter.textContent = cart.length;'), H21.cart),
      fj(rep(cartJs, '  cart = [];\n  update();', '  cart = [];\n  counter.textContent = 0;'), H21.cart),
    ],
  },
  'web-21-recent-searches': {
    valid: [fj(recentJs, H21.recent)],
    wrong: [
      fj(rep(recentJs, '.slice(0, 5);\n  box', ';\n  box'), H21.recent),
      fj(rep(recentJs, 't.toLowerCase() !== term.toLowerCase()', 't !== term'), H21.recent),
      fj(rep(recentJs, '[term, ...recent.filter((t) => t.toLowerCase() !== term.toLowerCase())]', '[...recent.filter((t) => t.toLowerCase() !== term.toLowerCase()), term]'), H21.recent),
      fj(rep(recentJs, 'const term = box.value.trim();\n  if (term === "") return;', 'const term = box.value.trim();'), H21.recent),
      fj(rep(recentJs, '  box.value = "";\n', ''), H21.recent),
      fj(rep(recentJs, 'typeof x === "string" && x !== ""', 'true'), H21.recent),
      fj(rep(recentJs, 'Array.isArray(data) ? data.filter((x) => typeof x === "string" && x !== "").slice(0, 5) : []', 'data'), H21.recent),
      fj(rep(recentJs, '  } catch {\n    return [];\n  }', '  } finally {\n  }\n  return [];'), H21.recent),
    ],
  },
  'web-21-parse-config': {
    valid: [fj(configJs)],
    wrong: [
      fj(rep(configJs, '  } catch {\n    return defaults;\n  }', '  } finally {\n  }'), ''),
      fj(rep(configJs, 'data === null || ', ''), ''),
      fj(rep(configJs, 'data.retries <= 10', 'data.retries < 10'), ''),
      fj(rep(configJs, 'data.retries >= 0 && ', ''), ''),
      fj(rep(configJs, 'Number.isInteger(data.retries) && ', 'typeof data.retries === "number" && '), ''),
      fj(rep(configJs, 'data.timeout > 0', 'data.timeout >= 0'), ''),
      fj(rep(configJs, 'data.name.trim() !== "" ? data.name.trim()', 'data.name !== "" ? data.name'), ''),
    ],
  },
  'web-21-parse-roster': {
    valid: [fj(rosterJs), fj('const readRoster = (text) => {\n  try {\n    const data = JSON.parse(text);\n    return (Array.isArray(data) ? data : []).filter((p) => p && typeof p.name === "string" && p.name.trim() && Number.isInteger(p.age) && p.age >= 0 && p.age <= 120).map(({ name, age }) => ({ name: name.trim(), age }));\n  } catch {\n    return [];\n  }\n};\n')],
    wrong: [
      fj(rep(rosterJs, '  } catch {\n    return [];\n  }', '  } finally {\n  }'), ''),
      fj(rep(rosterJs, '  if (!Array.isArray(data)) return [];\n', ''), ''),
      fj(rep(rosterJs, 'p.age <= 120', 'p.age < 120'), ''),
      fj(rep(rosterJs, 'p.age >= 0 && ', ''), ''),
      fj(rep(rosterJs, 'Number.isInteger(p.age)', 'typeof p.age === "number"'), ''),
      fj(rep(rosterJs, 'name: p.name.trim()', 'name: p.name'), ''),
      fj(rep(rosterJs, 'p && typeof p.name === "string" && p.name.trim() !== ""', 'p && typeof p.name === "string"'), ''),
      fj(rep(rosterJs, 'roster.push({ name: p.name.trim(), age: p.age });', 'roster.unshift({ name: p.name.trim(), age: p.age });'), ''),
    ],
  },
});

/* ------------------------------------------------------------ lesson 22: time and promises */
import { HTML as H22 } from './22-async';

const countdownJs = 'const timer = document.querySelector("#timer");\nlet left = 5;\nconst id = setInterval(() => {\n  left--;\n  if (left === 0) {\n    timer.textContent = "Go!";\n    clearInterval(id);\n  } else {\n    timer.textContent = left;\n  }\n}, 1000);\n';
const bannerJs = 'const MESSAGES = ["Sale ends today", "Free delivery", "New arrivals"];\nconst banner = document.querySelector("#banner");\nconst pause = document.querySelector("#pause");\nlet index = 0;\nlet timer = null;\n\nfunction show() {\n  banner.textContent = MESSAGES[index];\n}\nfunction start() {\n  timer = setInterval(() => {\n    index = (index + 1) % MESSAGES.length;\n    show();\n  }, 3000);\n}\nshow();\nstart();\npause.addEventListener("click", () => {\n  if (timer === null) {\n    start();\n    pause.textContent = "Pause";\n  } else {\n    clearInterval(timer);\n    timer = null;\n    pause.textContent = "Resume";\n  }\n});\n';
const sessionJs = 'const field = document.querySelector("#field");\nconst warn = document.querySelector("#warn");\nlet timer;\nfunction arm() {\n  clearTimeout(timer);\n  timer = setTimeout(() => {\n    warn.textContent = "Session expired";\n  }, 30000);\n}\nfield.addEventListener("input", arm);\ndocument.querySelector("#renew").addEventListener("click", () => {\n  warn.textContent = "";\n  arm();\n});\narm();\n';
const retryJs = 'async function retry(task, times) {\n  let last;\n  for (let attempt = 0; attempt < times; attempt++) {\n    try {\n      return await task();\n    } catch (error) {\n      last = error;\n    }\n  }\n  throw last;\n}\n';
const timeoutJs = 'function withTimeout(task, ms) {\n  const timer = new Promise((_, reject) => {\n    setTimeout(() => reject(new Error("timeout")), ms);\n  });\n  return Promise.race([Promise.resolve().then(task), timer]);\n}\n';

Object.assign(appSolutions, {
  'web-22-countdown': {
    valid: [fj(countdownJs, H22.countdown)],
    wrong: [fj(rep(countdownJs, '    clearInterval(id);\n', ''), H22.countdown), fj(rep(countdownJs, 'left === 0', 'left === 1'), H22.countdown), fj(rep(countdownJs, '"Go!"', '"0"'), H22.countdown), fj(rep(countdownJs, '1000', '100'), H22.countdown), fj(rep(countdownJs, 'const id = setInterval', 'const id = setTimeout'), H22.countdown)],
  },
  'web-22-banner-rotator': {
    valid: [fj(bannerJs, H22.banner)],
    wrong: [
      fj(rep(bannerJs, '    clearInterval(timer);\n', ''), H22.banner),
      fj(rep(bannerJs, '(index + 1) % MESSAGES.length', 'index + 1'), H22.banner),
      fj(rep(bannerJs, '    start();\n    pause.textContent = "Pause";', '    index = 0;\n    show();\n    start();\n    pause.textContent = "Pause";'), H22.banner),
      fj(rep(bannerJs, '    pause.textContent = "Resume";\n', ''), H22.banner),
      fj(rep(bannerJs, 'setInterval(() => {', 'setTimeout(() => {'), H22.banner),
      fj(rep(bannerJs, '  if (timer === null) {\n    start();', '  start();\n  if (timer === null) {\n    start();'), H22.banner),
      fj(rep(bannerJs, '}, 3000);', '}, 2000);'), H22.banner),
    ],
  },
  'web-22-session-timeout': {
    valid: [fj(sessionJs, H22.session)],
    wrong: [
      fj(rep(sessionJs, '  clearTimeout(timer);\n', ''), H22.session),
      fj(rep(sessionJs, '  warn.textContent = "";\n  arm();', '  warn.textContent = "";'), H22.session),
      fj(rep(sessionJs, '  warn.textContent = "";\n  arm();', '  arm();'), H22.session),
      fj(rep(sessionJs, 'field.addEventListener("input", arm);\n', ''), H22.session),
      fj(rep(sessionJs, '30000', '3000'), H22.session),
      fj(rep(sessionJs, '30000', '31000'), H22.session),
    ],
  },
  'web-22-retry-task': {
    valid: [fj(retryJs), fj('async function retry(task, times) {\n  try {\n    return await task();\n  } catch (error) {\n    if (times <= 1) throw error;\n    return retry(task, times - 1);\n  }\n}\n')],
    wrong: [
      fj(rep(retryJs, 'attempt < times', 'attempt <= times')),
      fj(rep(retryJs, 'throw last;', 'return undefined;')),
      fj(rep(retryJs, 'return await task();', 'const value = await task();\n      if (attempt === 0) return value;')),
      fj('async function retry(task, times) {\n  let last;\n  for (let attempt = 0; attempt < times; attempt++) {\n    try {\n      await task();\n    } catch (error) {\n      last = error;\n    }\n  }\n  return "ok";\n}\n'),
      fj(rep(retryJs, 'last = error;', 'last = last ?? error;')),
      fj('async function retry(task, times) {\n  let last;\n  for (let attempt = 0; attempt < times; attempt++) {\n    const p = task();\n    try {\n      return await p;\n    } catch (error) {\n      last = error;\n    }\n  }\n  throw last;\n}\n'),
    ],
  },
  'web-22-with-timeout': {
    valid: [fj(timeoutJs), fj('function withTimeout(task, ms) {\n  return new Promise((resolve, reject) => {\n    const id = setTimeout(() => reject(new Error("timeout")), ms);\n    Promise.resolve().then(task).then(\n      (value) => { clearTimeout(id); resolve(value); },\n      (error) => { clearTimeout(id); reject(error); },\n    );\n  });\n}\n')],
    wrong: [
      fj(rep(timeoutJs, 'Promise.race([Promise.resolve().then(task), timer])', 'Promise.race([timer, Promise.resolve().then(task)])').replace('reject(new Error("timeout")), ms', 'reject(new Error("timeout")), ms + 100')),
      fj(rep(timeoutJs, 'new Error("timeout")', 'new Error("timed out")')),
      fj('function withTimeout(task, ms) {\n  return task();\n}\n'),
      fj('function withTimeout(task, ms) {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve("timeout"), ms);\n    task().then(resolve);\n  });\n}\n'),
      fj('function withTimeout(task, ms) {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => reject(new Error("timeout")), ms);\n    task().then(resolve).catch(() => resolve(undefined));\n  });\n}\n'),
    ],
  },
});

/* ------------------------------------------------------------ lesson 23: fetch */
import { HTML as H23 } from './23-fetch';

const machinesJs = 'async function load() {\n  const response = await fetch("/api/machines");\n  const machines = await response.json();\n  for (const m of machines) {\n    const li = document.createElement("li");\n    li.textContent = `${m.name}: ${m.status}`;\n    document.querySelector("#machines").append(li);\n  }\n}\nload();\n';
const boardApp = 'const state = document.querySelector("#state");\nconst total = document.querySelector("#total");\nconst board = document.querySelector("#board");\n\nasync function load() {\n  state.textContent = "Loading...";\n  const response = await fetch("/api/machines?status=down&sort=-downtime_hours");\n  if (!response.ok) {\n    state.textContent = `Could not load machines (status ${response.status})`;\n    return;\n  }\n  const machines = await response.json();\n  state.textContent = "";\n  for (const m of machines) {\n    const li = document.createElement("li");\n    li.textContent = `${m.name}: ${m.downtime_hours} h`;\n    board.append(li);\n  }\n  total.textContent = `${machines.length} down`;\n}\nload();\n';
const standingsApp = 'const state = document.querySelector("#state");\nconst table = document.querySelector("#table");\n\nasync function load() {\n  state.textContent = "Loading standings...";\n  const response = await fetch("/api/teams");\n  if (!response.ok) {\n    state.textContent = `Standings unavailable (HTTP ${response.status})`;\n    return;\n  }\n  const teams = await response.json();\n  teams.sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name));\n  state.textContent = "";\n  teams.forEach((t, i) => {\n    const row = document.createElement("tr");\n    for (const value of [i + 1, t.name, `${t.wins}-${t.losses}`]) {\n      const cell = document.createElement("td");\n      cell.textContent = value;\n      row.append(cell);\n    }\n    table.append(row);\n  });\n}\nload();\n';
const searchApp = 'const box = document.querySelector("#q");\nconst state = document.querySelector("#state");\nconst results = document.querySelector("#results");\n\nasync function search() {\n  const term = box.value.trim();\n  results.replaceChildren();\n  if (term === "") {\n    state.textContent = "Type something to search";\n    return;\n  }\n  state.textContent = "Searching...";\n  const response = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=5`);\n  if (!response.ok) {\n    state.textContent = `Search failed (status ${response.status})`;\n    return;\n  }\n  const products = await response.json();\n  const total = Number(response.headers.get("X-Total-Count"));\n  state.textContent = total === 0 ? `No products match "${term}"` : `Showing ${products.length} of ${total} matches`;\n  for (const p of products) {\n    const card = document.createElement("article");\n    card.className = "card";\n    const name = document.createElement("h3");\n    name.textContent = p.name;\n    const price = document.createElement("p");\n    price.className = "price";\n    price.textContent = "£" + p.price.toFixed(2);\n    card.append(name, price);\n    results.append(card);\n  }\n}\ndocument.querySelector("#go").addEventListener("click", search);\n';
const detailApp = 'const state = document.querySelector("#state");\nconst detail = document.querySelector("#detail");\n\nasync function show(id) {\n  state.textContent = "Loading...";\n  const response = await fetch(`/api/machines/${id}`);\n  if (!response.ok) {\n    detail.replaceChildren();\n    state.textContent = response.status === 404 ? "Machine not found" : `Could not load machine (status ${response.status})`;\n    return;\n  }\n  const m = await response.json();\n  state.textContent = "";\n  const name = document.createElement("h3");\n  name.textContent = m.name;\n  const status = document.createElement("p");\n  status.className = "status";\n  status.textContent = `Status: ${m.status}`;\n  const downtime = document.createElement("p");\n  downtime.className = "downtime";\n  downtime.textContent = `Downtime: ${m.downtime_hours} h`;\n  detail.replaceChildren(name, status, downtime);\n}\nfor (const button of document.querySelectorAll(".show")) {\n  button.addEventListener("click", () => show(button.dataset.id));\n}\n';
const playerApp = 'const state = document.querySelector("#state");\nconst card = document.querySelector("#card");\n\nasync function find() {\n  const text = document.querySelector("#num").value.trim();\n  const number = Number(text);\n  if (text === "" || !Number.isInteger(number) || number < 1) {\n    state.textContent = "Enter a player number";\n    return;\n  }\n  state.textContent = "Loading...";\n  const response = await fetch(`/api/players/${number}`);\n  if (!response.ok) {\n    card.replaceChildren();\n    state.textContent = response.status === 404 ? "No player with that number" : `Lookup failed (status ${response.status})`;\n    return;\n  }\n  const p = await response.json();\n  state.textContent = "";\n  const name = document.createElement("h3");\n  name.textContent = p.name;\n  const team = document.createElement("p");\n  team.className = "team";\n  team.textContent = p.team;\n  const avg = document.createElement("p");\n  avg.className = "avg";\n  avg.textContent = "Batting: " + p.batting_avg.toFixed(3).replace(/^0/, "");\n  card.replaceChildren(h3(name), team, avg);\n}\ndocument.querySelector("#find").addEventListener("click", find);\n'.replace('h3(name)', 'name');

Object.assign(appSolutions, {
  'web-23-load-machines': {
    valid: [fj(machinesJs, H23.machines)],
    wrong: [fj(rep(machinesJs, '    li.textContent = `${m.name}: ${m.status}`;', '    li.textContent = m.name;'), H23.machines), fj(rep(machinesJs, '/api/machines', '/api/teams'), H23.machines), fj('const names = ["Press A1: running"];\nfor (const n of names) {\n  const li = document.createElement("li");\n  li.textContent = n;\n  document.querySelector("#machines").append(li);\n}\n', H23.machines), fj(rep(machinesJs, 'await response.json()', 'response.json()'), H23.machines)],
  },
  'web-23-machine-board': {
    valid: [fj(boardApp, H23.board), fj('const state = document.querySelector("#state");\nconst total = document.querySelector("#total");\nconst board = document.querySelector("#board");\nstate.textContent = "Loading...";\nfetch("/api/machines")\n  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))\n  .then((all) => {\n    const down = all.filter((m) => m.status === "down").sort((a, b) => b.downtime_hours - a.downtime_hours);\n    state.textContent = "";\n    board.innerHTML = "";\n    down.forEach((m) => board.insertAdjacentHTML("beforeend", `<li>${m.name}: ${m.downtime_hours} h</li>`));\n    total.textContent = down.length + " down";\n  })\n  .catch((status) => {\n    state.textContent = `Could not load machines (status ${status})`;\n  });\n', H23.board)],
    wrong: [
      fj(rep(boardApp, '  state.textContent = "Loading...";\n', ''), H23.board),
      fj(rep(boardApp, '  if (!response.ok) {\n    state.textContent = `Could not load machines (status ${response.status})`;\n    return;\n  }\n', ''), H23.board),
      fj(rep(boardApp, '?status=down&sort=-downtime_hours', '?status=down'), H23.board),
      fj(rep(boardApp, '?status=down&sort=-downtime_hours', '?sort=-downtime_hours'), H23.board),
      fj(rep(boardApp, '  state.textContent = "";\n', ''), H23.board),
      fj(rep(boardApp, '`${machines.length} down`', '`${machines.length}`'), H23.board),
      fj(rep(boardApp, 'status ${response.status}', 'status 500'), H23.board),
      fj(rep(boardApp, 'sort=-downtime_hours', 'sort=downtime_hours'), H23.board),
    ],
  },
  'web-23-team-standings': {
    valid: [fj(standingsApp, H23.standings)],
    wrong: [
      fj(rep(standingsApp, 'b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name)', 'b.wins - a.wins'), H23.standings),
      fj(rep(standingsApp, 'b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name)', 'b.wins - a.wins || b.losses - a.losses'), H23.standings),
      fj(rep(standingsApp, '[i + 1, t.name', '[i, t.name'), H23.standings),
      fj(rep(standingsApp, '`${t.wins}-${t.losses}`', '`${t.wins}/${t.losses}`'), H23.standings),
      fj(rep(standingsApp, '  state.textContent = "Loading standings...";\n', ''), H23.standings),
      fj(rep(standingsApp, '  if (!response.ok) {\n    state.textContent = `Standings unavailable (HTTP ${response.status})`;\n    return;\n  }\n', ''), H23.standings),
      fj(rep(standingsApp, '  state.textContent = "";\n  teams.forEach', '  teams.forEach'), H23.standings),
    ],
  },
  'web-23-product-search': {
    valid: [fj(searchApp, H23.search)],
    wrong: [
      fj(rep(searchApp, 'encodeURIComponent(term)', 'term'), H23.search),
      fj(rep(searchApp, 'const term = box.value.trim();', 'const term = box.value;'), H23.search),
      fj(rep(searchApp, '&limit=5', ''), H23.search),
      fj(rep(searchApp, '  results.replaceChildren();\n  if (term', '  if (term'), H23.search),
      fj(rep(searchApp, 'Number(response.headers.get("X-Total-Count"))', 'products.length'), H23.search),
      fj(rep(searchApp, 'p.price.toFixed(2)', 'p.price'), H23.search),
      fj(rep(searchApp, '  if (term === "") {\n    state.textContent = "Type something to search";\n    return;\n  }\n', ''), H23.search),
      fj(rep(searchApp, '  state.textContent = "Searching...";\n', ''), H23.search),
      fj(rep(searchApp, '  if (!response.ok) {\n    state.textContent = `Search failed (status ${response.status})`;\n    return;\n  }\n', ''), H23.search),
      fj(rep(searchApp, 'total === 0 ? `No products match "${term}"` : ', ''), H23.search),
    ],
  },
  'web-23-machine-detail': {
    valid: [fj(detailApp, H23.detail)],
    wrong: [
      fj(rep(detailApp, 'response.status === 404 ? "Machine not found" : `Could not load machine (status ${response.status})`', '"Machine not found"'), H23.detail),
      fj(rep(detailApp, 'response.status === 404 ? "Machine not found" : `Could not load machine (status ${response.status})`', '`Could not load machine (status ${response.status})`'), H23.detail),
      fj(rep(detailApp, '  detail.replaceChildren(name, status, downtime);', '  detail.append(name, status, downtime);'), H23.detail),
      fj(rep(detailApp, '    detail.replaceChildren();\n', ''), H23.detail),
      fj(rep(detailApp, '  state.textContent = "Loading...";\n', ''), H23.detail),
      fj(rep(detailApp, '  state.textContent = "";\n  const name', '  const name'), H23.detail),
      fj(rep(detailApp, 'show(button.dataset.id)', 'show(1)'), H23.detail),
      fj(rep(detailApp, '  if (!response.ok) {', '  if (response.status === 404) {'), H23.detail),
    ],
  },
  'web-23-player-card': {
    valid: [fj(playerApp, H23.player)],
    wrong: [
      fj(rep(playerApp, 'text === "" || !Number.isInteger(number) || number < 1', 'false'), H23.player),
      fj(rep(playerApp, ' || number < 1', ''), H23.player),
      fj(rep(playerApp, '!Number.isInteger(number) || ', ''), H23.player),
      fj(rep(playerApp, '.replace(/^0/, "")', ''), H23.player),
      fj(rep(playerApp, 'toFixed(3)', 'toFixed(2)'), H23.player),
      fj(rep(playerApp, 'response.status === 404 ? "No player with that number" : `Lookup failed (status ${response.status})`', '"No player with that number"'), H23.player),
      fj(rep(playerApp, '  card.replaceChildren(name, team, avg);', '  card.append(name, team, avg);'), H23.player),
    ],
  },
});

/* ------------------------------------------------------------ lesson 24: writing and resilience */
import { HTML as H24 } from './24-fetch-write';

const addApp = 'const form = document.querySelector("#add-form");\nconst button = document.querySelector("#add");\nconst msg = document.querySelector("#msg");\nconst list = document.querySelector("#list");\nconst nameBox = document.querySelector("#name");\n\nfunction addItem(m) {\n  const li = document.createElement("li");\n  li.textContent = `${m.name} (${m.type})`;\n  list.append(li);\n}\nasync function loadStart() {\n  const response = await fetch("/api/machines?limit=3");\n  for (const m of await response.json()) addItem(m);\n}\nform.addEventListener("submit", async (event) => {\n  event.preventDefault();\n  button.disabled = true;\n  try {\n    const response = await fetch("/api/machines", {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ name: nameBox.value.trim(), type: document.querySelector("#type").value }),\n    });\n    const data = await response.json();\n    if (response.status === 201) {\n      msg.textContent = `Added ${data.name} (id ${data.id})`;\n      addItem(data);\n      nameBox.value = "";\n    } else {\n      msg.textContent = `Could not add: ${data.error}`;\n    }\n  } finally {\n    button.disabled = false;\n  }\n});\nloadStart();\n';
const restockApp = 'const rows = document.querySelector("#rows");\nconst msg = document.querySelector("#msg");\n\nfunction addRow(p) {\n  const tr = document.createElement("tr");\n  tr.dataset.id = p.id;\n  const name = document.createElement("td");\n  name.className = "name";\n  name.textContent = p.name;\n  const stock = document.createElement("td");\n  stock.className = "stock";\n  stock.textContent = p.stock;\n  const cell = document.createElement("td");\n  const button = document.createElement("button");\n  button.className = "restock";\n  button.textContent = "+10";\n  button.addEventListener("click", async () => {\n    button.disabled = true;\n    try {\n      const response = await fetch(`/api/products/${p.id}`, {\n        method: "PATCH",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({ stock: Number(stock.textContent) + 10 }),\n      });\n      if (response.ok) {\n        stock.textContent = (await response.json()).stock;\n        msg.textContent = "";\n      } else {\n        msg.textContent = `Update failed (status ${response.status})`;\n      }\n    } finally {\n      button.disabled = false;\n    }\n  });\n  cell.append(button);\n  tr.append(name, stock, cell);\n  rows.append(tr);\n}\nasync function load() {\n  const response = await fetch("/api/products?limit=4");\n  (await response.json()).forEach(addRow);\n}\nload();\n';
const teamsApp = 'const list = document.querySelector("#teams");\nconst msg = document.querySelector("#msg");\n\nfunction addItem(t) {\n  const li = document.createElement("li");\n  li.dataset.id = t.id;\n  const name = document.createElement("span");\n  name.className = "name";\n  name.textContent = t.name;\n  const button = document.createElement("button");\n  button.className = "delete";\n  button.textContent = "Remove";\n  button.addEventListener("click", async () => {\n    const response = await fetch(`/api/teams/${t.id}`, { method: "DELETE" });\n    if (response.status === 204) {\n      li.remove();\n      msg.textContent = `Removed ${t.name}`;\n    } else if (response.status === 404) {\n      li.remove();\n      msg.textContent = `${t.name} was already gone`;\n    } else {\n      msg.textContent = `Could not remove ${t.name} (status ${response.status})`;\n    }\n  });\n  li.append(name, button);\n  list.append(li);\n}\nasync function load() {\n  const response = await fetch("/api/teams");\n  (await response.json()).forEach(addItem);\n}\nload();\n';
const payrollApp = 'const state = document.querySelector("#state");\nconst rows = document.querySelector("#rows");\nconst total = document.querySelector("#total");\n\ndocument.querySelector("#load").addEventListener("click", async () => {\n  const key = document.querySelector("#key").value.trim();\n  rows.replaceChildren();\n  total.textContent = "";\n  if (key === "") {\n    state.textContent = "Enter your API key";\n    return;\n  }\n  state.textContent = "Loading...";\n  const response = await fetch("/api/private/employees", { headers: { Authorization: `Bearer ${key}` } });\n  if (response.status === 401) {\n    state.textContent = "Access denied: check your API key";\n    return;\n  }\n  if (!response.ok) {\n    state.textContent = `Could not load payroll (status ${response.status})`;\n    return;\n  }\n  const people = await response.json();\n  state.textContent = "";\n  for (const p of people) {\n    const tr = document.createElement("tr");\n    for (const value of [p.name, p.role, `£${p.rate.toFixed(2)}/h`]) {\n      const td = document.createElement("td");\n      td.textContent = value;\n      tr.append(td);\n    }\n    rows.append(tr);\n  }\n  const mean = people.reduce((sum, p) => sum + p.rate, 0) / people.length;\n  total.textContent = `Average rate: £${mean.toFixed(2)}`;\n});\n';
const flakyApp = 'const button = document.querySelector("#fetch");\nconst state = document.querySelector("#state");\nconst out = document.querySelector("#out");\nconst wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\n\nbutton.addEventListener("click", async () => {\n  button.disabled = true;\n  out.textContent = "";\n  for (let attempt = 1; attempt <= 3; attempt++) {\n    state.textContent = `Attempt ${attempt} of 3...`;\n    const response = await fetch("/api/flaky");\n    if (response.ok) {\n      out.textContent = JSON.stringify(await response.json());\n      state.textContent = `Loaded after ${attempt} attempt${attempt === 1 ? "" : "s"}`;\n      button.disabled = false;\n      return;\n    }\n    if (response.status < 500) {\n      state.textContent = `Request rejected (status ${response.status})`;\n      button.disabled = false;\n      return;\n    }\n    if (attempt < 3) {\n      state.textContent = `Attempt ${attempt} failed, retrying...`;\n      await wait(1000);\n    }\n  }\n  state.textContent = "Gave up after 3 attempts";\n  button.disabled = false;\n});\n';
const rateApp = 'const state = document.querySelector("#state");\nconst log = document.querySelector("#log");\n\ndocument.querySelector("#run").addEventListener("click", async () => {\n  log.replaceChildren();\n  state.textContent = "Sending...";\n  for (let n = 1; n <= 5; n++) {\n    const response = await fetch("/api/rate-limited");\n    const li = document.createElement("li");\n    log.append(li);\n    if (response.ok) {\n      li.textContent = `Request ${n}: ok`;\n      continue;\n    }\n    if (response.status === 429) {\n      li.textContent = `Request ${n}: rate limited`;\n      state.textContent = `Rate limited. Try again in ${response.headers.get("Retry-After")} seconds`;\n    } else {\n      li.textContent = `Request ${n}: failed (status ${response.status})`;\n      state.textContent = "Stopped after an error";\n    }\n    return;\n  }\n  state.textContent = "All done";\n});\n';

Object.assign(appSolutions, {
  'web-24-add-machine': {
    valid: [fj(addApp, H24.add)],
    wrong: [
      fj(rep(addApp, '      headers: { "Content-Type": "application/json" },\n', ''), H24.add),
      fj(rep(addApp, '  event.preventDefault();\n', ''), H24.add),
      fj(rep(addApp, '  button.disabled = true;\n', ''), H24.add),
      fj(rep(addApp, '  } finally {\n    button.disabled = false;\n  }', '  } catch (e) {}'), H24.add),
      fj(rep(addApp, 'msg.textContent = `Could not add: ${data.error}`;', 'msg.textContent = "Could not add";'), H24.add),
      fj(rep(addApp, '      addItem(data);\n', '      addItem({ name: nameBox.value, type: "press" });\n'), H24.add),
      fj(rep(addApp, '      nameBox.value = "";\n', ''), H24.add),
      fj(rep(addApp, 'if (response.status === 201) {', 'if (true) {'), H24.add),
      fj(rep(addApp, 'JSON.stringify({ name: nameBox.value.trim(), type: document.querySelector("#type").value })', 'JSON.stringify({ name: nameBox.value.trim(), type: document.querySelector("#type").value, id: 99 })'), H24.add),
    ],
  },
  'web-24-restock-products': {
    valid: [fj(restockApp, H24.restock)],
    wrong: [
      fj(rep(restockApp, 'method: "PATCH"', 'method: "POST"'), H24.restock),
      fj(rep(restockApp, '        headers: { "Content-Type": "application/json" },\n', ''), H24.restock),
      fj(rep(restockApp, '    button.disabled = true;\n', ''), H24.restock),
      fj(rep(restockApp, 'JSON.stringify({ stock: Number(stock.textContent) + 10 })', 'JSON.stringify({ stock: Number(stock.textContent) + 10, name: p.name })'), H24.restock),
      fj(rep(restockApp, 'Number(stock.textContent) + 10 })', 'Number(stock.textContent) + 1 })'), H24.restock),
      fj(rep(restockApp, '      if (response.ok) {\n        stock.textContent = (await response.json()).stock;\n        msg.textContent = "";\n      } else {\n        msg.textContent = `Update failed (status ${response.status})`;\n      }', '      stock.textContent = Number(stock.textContent) + 10;\n      if (!response.ok) msg.textContent = `Update failed (status ${response.status})`;'), H24.restock),
      fj(rep(restockApp, '        msg.textContent = "";\n', ''), H24.restock),
      fj(rep(restockApp, '    } finally {\n      button.disabled = false;\n    }', '    } catch (e) {}'), H24.restock),
    ],
  },
  'web-24-remove-teams': {
    valid: [fj(teamsApp, H24.teams)],
    wrong: [
      fj(rep(teamsApp, '{ method: "DELETE" }', '{ method: "POST" }'), H24.teams),
      fj(rep(teamsApp, '    if (response.status === 204) {', '    const body = await response.json();\n    if (response.status === 204) {'), H24.teams),
      fj(rep(teamsApp, '    } else if (response.status === 404) {\n      li.remove();\n      msg.textContent = `${t.name} was already gone`;\n    } else {', '    } else {'), H24.teams),
      fj(rep(teamsApp, '    if (response.status === 204) {\n      li.remove();', '    li.remove();\n    if (response.status === 204) {'), H24.teams),
      fj(rep(teamsApp, '`/api/teams/${t.id}`', '`/api/teams/1`'), H24.teams),
      fj(rep(teamsApp, '`Removed ${t.name}`', '"Removed"'), H24.teams),
    ],
  },
  'web-24-payroll-report': {
    valid: [fj(payrollApp, H24.payroll)],
    wrong: [
      fj(rep(payrollApp, '{ headers: { Authorization: `Bearer ${key}` } }', '{ headers: { Authorization: key } }'), H24.payroll),
      fj(rep(payrollApp, 'const key = document.querySelector("#key").value.trim();', 'const key = document.querySelector("#key").value;'), H24.payroll),
      fj(rep(payrollApp, '  rows.replaceChildren();\n  total.textContent = "";\n', ''), H24.payroll),
      fj(rep(payrollApp, '  if (key === "") {\n    state.textContent = "Enter your API key";\n    return;\n  }\n', ''), H24.payroll),
      fj(rep(payrollApp, '  if (response.status === 401) {\n    state.textContent = "Access denied: check your API key";\n    return;\n  }\n', ''), H24.payroll),
      fj(rep(payrollApp, '  if (!response.ok) {\n    state.textContent = `Could not load payroll (status ${response.status})`;\n    return;\n  }\n', ''), H24.payroll),
      fj(rep(payrollApp, '`£${p.rate.toFixed(2)}/h`', '`£${p.rate}/h`'), H24.payroll),
      fj(rep(payrollApp, 'mean.toFixed(2)', 'mean.toFixed(1)'), H24.payroll),
      fj(rep(payrollApp, '  state.textContent = "Loading...";\n', ''), H24.payroll),
      fj(rep(payrollApp, '  state.textContent = "";\n  for', '  for'), H24.payroll),
    ],
  },
  'web-24-flaky-retry': {
    valid: [fj(flakyApp, H24.flaky)],
    wrong: [
      fj(rep(flakyApp, '      await wait(1000);\n', ''), H24.flaky),
      fj(rep(flakyApp, 'wait(1000)', 'wait(100)'), H24.flaky),
      fj(rep(flakyApp, 'attempt <= 3', 'attempt <= 4'), H24.flaky),
      fj(rep(flakyApp, '    if (response.status < 500) {\n      state.textContent = `Request rejected (status ${response.status})`;\n      button.disabled = false;\n      return;\n    }\n', ''), H24.flaky),
      fj(rep(flakyApp, '`Loaded after ${attempt} attempt${attempt === 1 ? "" : "s"}`', '`Loaded after ${attempt} attempts`'), H24.flaky),
      fj(rep(flakyApp, '  state.textContent = "Gave up after 3 attempts";\n  button.disabled = false;', '  state.textContent = "Gave up after 3 attempts";'), H24.flaky),
      fj(rep(flakyApp, '  button.disabled = true;\n', ''), H24.flaky),
      fj(rep(flakyApp, '      out.textContent = JSON.stringify(await response.json());\n', ''), H24.flaky),
      fj(rep(flakyApp, '  out.textContent = "";\n', ''), H24.flaky),
    ],
  },
  'web-24-rate-limit': {
    valid: [fj(rateApp, H24.rate)],
    wrong: [
      fj(rep(rateApp, 'response.headers.get("Retry-After")', '2'), H24.rate),
      fj(rep(rateApp, '    return;\n  }\n  state.textContent = "All done";', '    continue;\n  }\n  state.textContent = "All done";'), H24.rate),
      fj(rep(rateApp, '  log.replaceChildren();\n', ''), H24.rate),
      fj(rep(rateApp, '`Request ${n}: failed (status ${response.status})`', '`Request ${n}: rate limited`'), H24.rate),
      fj(rep(rateApp, '"Stopped after an error"', '"Rate limited"'), H24.rate),
    ],
  },
});

/* ------------------------------------------------------------ lesson 26: independent web trial */
import { HTML as H26 } from './26-web-trial';

const convJs = 'const value = document.querySelector("#value");\nconst from = document.querySelector("#from");\nconst to = document.querySelector("#to");\nconst result = document.querySelector("#result");\nconst SYMBOL = { C: "°C", F: "°F", K: "K" };\n\nconst toCelsius = (v, unit) => (unit === "C" ? v : unit === "F" ? ((v - 32) * 5) / 9 : v - 273.15);\nconst fromCelsius = (c, unit) => (unit === "C" ? c : unit === "F" ? (c * 9) / 5 + 32 : c + 273.15);\n\nfunction update() {\n  const raw = value.value.trim();\n  const n = Number(raw);\n  if (raw === "" || !Number.isFinite(n)) {\n    result.textContent = "Enter a number";\n    return;\n  }\n  const celsius = toCelsius(n, from.value);\n  if (celsius < -273.15) {\n    result.textContent = "Below absolute zero";\n    return;\n  }\n  let shown = fromCelsius(celsius, to.value).toFixed(1);\n  if (Number(shown) === 0) shown = "0.0";\n  result.textContent = `${shown} ${SYMBOL[to.value]}`;\n}\nfor (const el of [value, from, to]) el.addEventListener("input", update);\nupdate();\n';
const weatherJs = 'const state = document.querySelector("#state");\nconst list = document.querySelector("#cities");\n\nasync function load() {\n  state.textContent = "Loading weather...";\n  let rows;\n  try {\n    const response = await fetch("/api/weather");\n    if (!response.ok) throw new Error("bad status");\n    rows = await response.json();\n  } catch {\n    state.textContent = "Weather unavailable";\n    return;\n  }\n  const cities = {};\n  for (const r of rows) {\n    const c = (cities[r.city] ||= { temp: 0, n: 0, rain: 0 });\n    c.temp += r.temp_c;\n    c.n++;\n    c.rain += r.rain_mm;\n  }\n  const summary = Object.entries(cities).map(([city, c]) => ({ city, avg: c.temp / c.n, rain: c.rain }));\n  summary.sort((a, b) => b.avg - a.avg);\n  state.textContent = "";\n  for (const s of summary) {\n    const li = document.createElement("li");\n    li.textContent = `${s.city}: ${s.avg.toFixed(1)} °C, ${s.rain.toFixed(1)} mm rain`;\n    list.append(li);\n  }\n}\nload();\n';
const enrolJs = 'const form = document.querySelector("#enrol");\nconst select = document.querySelector("#course");\nconst state = document.querySelector("#state");\nlet courses = [];\n\nconst seatText = (n) => `${n} seat${n === 1 ? "" : "s"}`;\nfunction render() {\n  select.replaceChildren();\n  for (const c of courses.filter((x) => x.seats > 0)) {\n    select.append(new Option(`${c.title} (${seatText(c.seats)})`, c.id));\n  }\n}\nasync function load() {\n  const response = await fetch("/api/courses");\n  courses = await response.json();\n  render();\n}\nform.addEventListener("submit", async (event) => {\n  event.preventDefault();\n  const student = document.querySelector("#student").value.trim();\n  if (student.length < 2) {\n    state.textContent = "Enter the student name";\n    return;\n  }\n  const course = courses.find((c) => String(c.id) === select.value);\n  if (!course) return;\n  const response = await fetch(`/api/courses/${course.id}`, {\n    method: "PATCH",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ seats: course.seats - 1 }),\n  });\n  if (!response.ok) {\n    state.textContent = `Could not enrol (status ${response.status})`;\n    return;\n  }\n  Object.assign(course, await response.json());\n  state.textContent = `Enrolled ${student} in ${course.title}`;\n  render();\n});\nload();\n';
const filterJs = 'const box = document.querySelector("#q");\nconst count = document.querySelector("#count");\nconst items = [...document.querySelectorAll("#cities li")];\nlet timer;\n\nfunction apply() {\n  const needle = box.value.trim().toLowerCase();\n  let shown = 0;\n  for (const li of items) {\n    const match = li.textContent.toLowerCase().includes(needle);\n    li.hidden = !match;\n    if (match) shown++;\n  }\n  count.textContent = `${shown} of ${items.length} shown`;\n}\nbox.addEventListener("input", () => {\n  clearTimeout(timer);\n  timer = setTimeout(apply, 300);\n});\napply();\n';
const salesJs = 'function summarize(orders) {\n  const byCustomer = new Map();\n  for (const order of orders) {\n    if (order.status === "cancelled") continue;\n    const entry = byCustomer.get(order.customer) ?? { customer: order.customer, orders: 0, cents: 0 };\n    entry.orders++;\n    for (const line of order.lines) entry.cents += line.price * line.qty * 100;\n    byCustomer.set(order.customer, entry);\n  }\n  return [...byCustomer.values()]\n    .map((e) => ({ customer: e.customer, orders: e.orders, total: Math.round(e.cents) / 100 }))\n    .sort((a, b) => b.total - a.total || (a.customer < b.customer ? -1 : a.customer > b.customer ? 1 : 0));\n}\n';

Object.assign(appSolutions, {
  'web-26-unit-converter': {
    valid: [fj(convJs, H26.convert)],
    wrong: [
      fj(rep(convJs, '  if (celsius < -273.15) {\n    result.textContent = "Below absolute zero";\n    return;\n  }\n', ''), H26.convert),
      fj(rep(convJs, '  if (Number(shown) === 0) shown = "0.0";\n', ''), H26.convert),
      fj(rep(convJs, 'const raw = value.value.trim();', 'const raw = value.value;'), H26.convert),
      fj(rep(convJs, 'raw === "" || ', ''), H26.convert),
      fj(rep(convJs, 'v - 273.15', 'v - 273'), H26.convert),
      fj(rep(convJs, '(c * 9) / 5 + 32', '(c * 5) / 9 + 32'), H26.convert),
      fj(rep(convJs, 'Number.isFinite(n)', 'true'), H26.convert),
      fj(rep(convJs, 'toFixed(1)', 'toFixed(2)'), H26.convert),
      fj(rep(convJs, 'const n = Number(raw);', 'const n = parseFloat(raw);'), H26.convert),
      fj(rep(convJs, 'for (const el of [value, from, to]) el.addEventListener("input", update);\nupdate();\n', 'for (const el of [value, from, to]) el.addEventListener("input", update);\n'), H26.convert),
      fj(rep(convJs, 'celsius < -273.15', 'celsius <= -273.15'), H26.convert),
    ],
  },
  'web-26-weather-board': {
    valid: [fj(weatherJs, H26.weather)],
    wrong: [
      fj(rep(weatherJs, '  summary.sort((a, b) => b.avg - a.avg);\n', ''), H26.weather),
      fj(rep(weatherJs, 'summary.sort((a, b) => b.avg - a.avg)', 'summary.sort((a, b) => a.avg - b.avg)'), H26.weather),
      fj(rep(weatherJs, 'temp: 0, n: 0, rain: 0', 'temp: 0, n: 1, rain: 0'), H26.weather),
      fj(rep(weatherJs, 'c.rain += r.rain_mm;', 'c.rain = r.rain_mm;'), H26.weather),
      fj(rep(weatherJs, '    if (!response.ok) throw new Error("bad status");\n', ''), H26.weather),
      fj(rep(weatherJs, '  state.textContent = "Loading weather...";\n', ''), H26.weather),
      fj(rep(weatherJs, '  state.textContent = "";\n  for', '  for'), H26.weather),
      fj(rep(weatherJs, '.toFixed(1)} mm rain', '.toFixed(0)} mm rain'), H26.weather),
      fj(rep(weatherJs, 'c.temp += r.temp_c;', 'c.temp = Math.max(c.temp, r.temp_c);'), H26.weather),
    ],
  },
  'web-26-course-enrol': {
    valid: [fj(enrolJs, H26.enrol)],
    wrong: [
      fj(rep(enrolJs, '  event.preventDefault();\n', ''), H26.enrol),
      fj(rep(enrolJs, 'student.length < 2', 'student.length < 1'), H26.enrol),
      fj(rep(enrolJs, 'const student = document.querySelector("#student").value.trim();', 'const student = document.querySelector("#student").value;'), H26.enrol),
      fj(rep(enrolJs, 'seats: course.seats - 1', 'seats: course.seats'), H26.enrol),
      fj(rep(enrolJs, '  if (!response.ok) {\n    state.textContent = `Could not enrol (status ${response.status})`;\n    return;\n  }\n', ''), H26.enrol),
      fj(rep(enrolJs, '  Object.assign(course, await response.json());\n', ''), H26.enrol),
      fj(rep(enrolJs, 'courses.filter((x) => x.seats > 0)', 'courses'), H26.enrol),
      fj(rep(enrolJs, '`${n} seat${n === 1 ? "" : "s"}`', '`${n} seats`'), H26.enrol),
      fj(rep(enrolJs, '  render();\n});', '});'), H26.enrol),
      fj(rep(enrolJs, '    body: JSON.stringify({ seats: course.seats - 1 }),', '    body: JSON.stringify({ seats: 0 }),'), H26.enrol),
    ],
  },
  'web-26-city-filter': {
    valid: [fj(filterJs, H26.cities)],
    wrong: [
      fj(rep(filterJs, '  clearTimeout(timer);\n', ''), H26.cities),
      fj(rep(filterJs, '  timer = setTimeout(apply, 300);', '  apply();'), H26.cities),
      fj(rep(filterJs, 'setTimeout(apply, 300)', 'setTimeout(apply, 100)'), H26.cities),
      fj(rep(filterJs, 'setTimeout(apply, 300)', 'setTimeout(apply, 500)'), H26.cities),
      fj(rep(filterJs, '.toLowerCase().includes(needle)', '.includes(needle)'), H26.cities),
      fj(rep(filterJs, 'box.value.trim().toLowerCase()', 'box.value.toLowerCase()'), H26.cities),
      fj(rep(filterJs, '    li.hidden = !match;\n', '    li.style.display = match ? "" : "none";\n'), H26.cities),
      fj(rep(filterJs, '  timer = setTimeout(apply, 300);\n});\napply();', '  timer = setTimeout(apply, 300);\n});'), H26.cities),
    ],
  },
  'web-26-sales-summary': {
    valid: [fj(salesJs), fj('const summarize = (orders) => {\n  const totals = {};\n  const counts = {};\n  orders.filter((o) => o.status !== "cancelled").forEach((o) => {\n    totals[o.customer] = (totals[o.customer] || 0) + o.lines.reduce((s, l) => s + Math.round(l.price * l.qty * 100), 0);\n    counts[o.customer] = (counts[o.customer] || 0) + 1;\n  });\n  return Object.keys(totals)\n    .map((customer) => ({ customer, orders: counts[customer], total: totals[customer] / 100 }))\n    .sort((a, b) => b.total - a.total || a.customer.localeCompare(b.customer, "en", { sensitivity: "variant" }));\n};\n')],
    wrong: [
      fj(rep(salesJs, '    if (order.status === "cancelled") continue;\n', '')),
      fj(rep(salesJs, 'order.status === "cancelled"', 'order.status.toLowerCase() === "cancelled"')),
      fj(rep(salesJs, 'Math.round(e.cents) / 100', 'e.cents / 100')),
      fj(rep(salesJs, 'Math.round(e.cents) / 100', 'Math.floor(e.cents) / 100')),
      fj(rep(salesJs, 'b.total - a.total || ', 'a.total - b.total || ')),
      fj(rep(salesJs, 'b.total - a.total || (a.customer < b.customer ? -1 : a.customer > b.customer ? 1 : 0)', 'b.total - a.total')),
      fj(rep(salesJs, 'entry.orders++;', 'entry.orders = 1;')),
      fj('function summarize(orders) {\n  const by = {};\n  for (const o of orders) {\n    if (o.status === "cancelled" || o.lines.length === 0) continue;\n    by[o.customer] ??= { customer: o.customer, orders: 0, total: 0 };\n    by[o.customer].orders++;\n    for (const l of o.lines) by[o.customer].total += l.price * l.qty;\n  }\n  return Object.values(by).map((e) => ({ ...e, total: Math.round(e.total * 100) / 100 })).sort((a, b) => b.total - a.total || (a.customer < b.customer ? -1 : 1));\n}\n'),
      fj('function summarize(orders) {\n  orders.sort((a, b) => a.customer < b.customer ? -1 : 1);\n' + salesJs.split('\n').slice(1).join('\n')),
      fj(rep(salesJs, 'line.price * line.qty * 100', 'line.price * line.qty * 100 + 0.5')),
    ],
  },
});
