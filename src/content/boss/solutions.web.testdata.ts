/** TEST-ONLY DATA: reference solutions and plausible wrong attempts for the web Boss challenges (run in Chromium by content/web/web.test.ts). */
import type { WebFiles } from '../schema';
import { CHECKLIST_HTML, ROSTER_HTML } from './web';

type Sol = { valid: WebFiles[]; wrong: WebFiles[] };
const J = (js: string, html = ''): WebFiles => ({ html, css: '', js });
const rep = (js: string, from: string, to: string) => {
  const out = js.replace(from, to);
  if (out === js) throw new Error('boss web solutions: replacement did nothing: ' + from);
  return out;
};

const pack = 'function pack(items, size) {\n  if (size < 1) throw new Error("size must be at least 1");\n  const boxes = [];\n  for (let i = 0; i < items.length; i += size) boxes.push(items.slice(i, i + size));\n  return boxes;\n}\n';
const mostCommon = 'function mostCommon(words) {\n  const counts = new Map();\n  let best = null;\n  let bestCount = 0;\n  for (const w of words) {\n    const key = w.trim().toLowerCase();\n    const n = (counts.get(key) || 0) + 1;\n    counts.set(key, n);\n    if (n > bestCount) { bestCount = n; best = key; }\n  }\n  return best;\n}\n';
const roster = 'const q = document.querySelector("#q");\nconst role = document.querySelector("#role");\nconst items = [...document.querySelectorAll("#roster li")];\nconst count = document.querySelector("#count");\nfunction update() {\n  const text = q.value.trim().toLowerCase();\n  let shown = 0;\n  for (const li of items) {\n    const ok = li.textContent.toLowerCase().includes(text) && (role.value === "" || li.dataset.role === role.value);\n    li.hidden = !ok;\n    if (ok) shown++;\n  }\n  count.textContent = shown === 0 ? "No matches" : shown + " shown";\n}\nq.addEventListener("input", update);\nrole.addEventListener("change", update);\nupdate();\n';
const checklist = 'const boxes = [...document.querySelectorAll("#checks input")];\nconst progress = document.querySelector("#progress");\nfunction load() {\n  try {\n    const saved = JSON.parse(localStorage.getItem("done") || "[]");\n    return Array.isArray(saved) ? saved.filter((x) => typeof x === "string") : [];\n  } catch (e) {\n    return [];\n  }\n}\nfunction render() {\n  const n = boxes.filter((b) => b.checked).length;\n  progress.textContent = n === boxes.length ? "All done!" : n + " of " + boxes.length + " done";\n}\nconst saved = load();\nfor (const b of boxes) b.checked = saved.includes(b.dataset.id);\nfor (const b of boxes) b.addEventListener("change", () => {\n  localStorage.setItem("done", JSON.stringify(boxes.filter((x) => x.checked).map((x) => x.dataset.id)));\n  render();\n});\nrender();\n';

export const webBossSolutions: Record<string, Sol> = {
  'boss-web-script-a': {
    valid: [J(pack)],
    wrong: [
      J(rep(pack, 'if (size < 1) throw new Error("size must be at least 1");', 'size = Math.max(size, 1);')),
      J(rep(pack, 'i += size', 'i += size + 1')),
      J(rep(pack, 'if (size < 1) throw', 'if (size < 1) size = 1; if (size < 0) throw')),
      J('function pack(items, size) {\n  if (size < 1) throw new Error("bad");\n  const boxes = [];\n  while (items.length) boxes.push(items.splice(0, size));\n  return boxes;\n}\n'),
      J(rep(pack, 'throw new Error("size must be at least 1")', 'return []')),
    ],
  },
  'boss-web-script-b': {
    valid: [J(mostCommon)],
    wrong: [
      J(rep(mostCommon, 'w.trim().toLowerCase()', 'w.trim()')),
      J(rep(mostCommon, 'w.trim().toLowerCase()', 'w.toLowerCase()')),
      J(rep(mostCommon, 'n > bestCount', 'n >= bestCount')),
      J(rep(mostCommon, 'let best = null;', 'let best = "";')),
      J('function mostCommon(words) {\n  const counts = {};\n  for (const w of words) { const k = w.trim().toLowerCase(); counts[k] = (counts[k] || 0) + 1; }\n  let best = null;\n  for (const k of Object.keys(counts).sort()) if (best === null || counts[k] > counts[best]) best = k;\n  return best;\n}\n'),
    ],
  },
  'boss-web-mastery-a': {
    valid: [J(roster, ROSTER_HTML)],
    wrong: [
      J(rep(roster, 'q.addEventListener("input", update);\n', ''), ROSTER_HTML),
      J(rep(roster, 'role.addEventListener("change", update);\n', ''), ROSTER_HTML),
      J(rep(roster, 'update();\n', '').replace(/update\(\);\n$/, ''), ROSTER_HTML),
      J(rep(roster, ' && (role.value === "" || li.dataset.role === role.value)', ''), ROSTER_HTML),
      J(rep(roster, 'q.value.trim().toLowerCase()', 'q.value.toLowerCase()'), ROSTER_HTML),
      J(rep(roster, 'li.textContent.toLowerCase()', 'li.textContent'), ROSTER_HTML),
      J(rep(roster, '"No matches"', '"0 shown"'), ROSTER_HTML),
      J(rep(roster, 'li.hidden = !ok;', 'if (!ok) li.remove();'), ROSTER_HTML),
    ],
  },
  'boss-web-mastery-b': {
    valid: [J(checklist, CHECKLIST_HTML)],
    wrong: [
      J(rep(checklist, '  localStorage.setItem("done", JSON.stringify(boxes.filter((x) => x.checked).map((x) => x.dataset.id)));\n', ''), CHECKLIST_HTML),
      J(rep(checklist, 'try {\n    const saved = JSON.parse(localStorage.getItem("done") || "[]");\n    return Array.isArray(saved) ? saved.filter((x) => typeof x === "string") : [];\n  } catch (e) {\n    return [];\n  }', 'return JSON.parse(localStorage.getItem("done") || "[]");'), CHECKLIST_HTML),
      J(rep(checklist, 'Array.isArray(saved) ? saved.filter((x) => typeof x === "string") : []', 'saved'), CHECKLIST_HTML),
      J(rep(checklist, 'n === boxes.length ? "All done!" : ', ''), CHECKLIST_HTML),
      J(rep(checklist, 'render();\n});\nrender();\n', 'render();\n});\n'), CHECKLIST_HTML),
      J(rep(checklist, 'JSON.stringify(boxes.filter((x) => x.checked).map((x) => x.dataset.id))', 'JSON.stringify(boxes.filter((x) => x.checked).length)'), CHECKLIST_HTML),
      J(rep(checklist, 'for (const b of boxes) b.checked = saved.includes(b.dataset.id);\n', ''), CHECKLIST_HTML),
    ],
  },
};
