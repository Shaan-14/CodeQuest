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
