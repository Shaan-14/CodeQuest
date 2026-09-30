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
