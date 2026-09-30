import type { WebFiles } from '../schema';
import type { Sol } from './solutions.testdata';

/** Reference solutions for the integrated web projects (lesson 25). Wrong attempts are derived by breaking ONE thing. */
export const projectSolutions: Record<string, Sol> = {};
const F = (html: string, css: string, js: string): WebFiles => ({ html, css, js });
const rep = (f: WebFiles, part: keyof WebFiles, from: string, to: string): WebFiles => {
  const out = f[part].replace(from, to);
  if (out === f[part]) throw new Error(`solutions.projects: replacement did nothing in ${part}: ${from}`);
  return { ...f, [part]: out };
};

/* ------------------------------------------------------------ A: machine dashboard */
const dashHtml = '<main>\n  <h1>Machine Shop</h1>\n  <nav aria-label="Filter machines">\n    <button class="filter" data-status="all" aria-pressed="true">All</button>\n    <button class="filter" data-status="running" aria-pressed="false">Running</button>\n    <button class="filter" data-status="idle" aria-pressed="false">Idle</button>\n    <button class="filter" data-status="down" aria-pressed="false">Down</button>\n  </nav>\n  <p id="summary"></p>\n  <p id="state" role="status"></p>\n  <ul id="machines"></ul>\n</main>\n';
const dashCss = '* { box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }\nnav { display: flex; gap: 8px; flex-wrap: wrap; }\n.filter[aria-pressed="true"] { font-weight: bold; background: #1a3a6b; color: #fff; }\n#machines { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }\n.machine { border: 1px solid #cccccc; border-radius: 6px; padding: 12px; }\n.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; color: #ffffff; }\n.running .badge { background: #1b7f3b; }\n.idle .badge { background: #b57600; }\n.down .badge { background: #b00020; }\n';
const dashJs = 'const KEY = "machine-filter";\nconst STATUSES = ["running", "idle", "down"];\nconst state = document.querySelector("#state");\nconst summary = document.querySelector("#summary");\nconst list = document.querySelector("#machines");\nlet machines = [];\nlet filter = savedFilter();\n\nfunction savedFilter() {\n  try {\n    const value = localStorage.getItem(KEY);\n    return value === "all" || STATUSES.includes(value) ? value : "all";\n  } catch {\n    return "all";\n  }\n}\nfunction render() {\n  for (const button of document.querySelectorAll(".filter")) {\n    const status = button.dataset.status;\n    const count = status === "all" ? machines.length : machines.filter((m) => m.status === status).length;\n    button.textContent = `${status[0].toUpperCase()}${status.slice(1)} (${count})`;\n    button.setAttribute("aria-pressed", String(status === filter));\n  }\n  const shown = filter === "all" ? machines : machines.filter((m) => m.status === filter);\n  list.replaceChildren();\n  for (const m of shown) {\n    const li = document.createElement("li");\n    li.className = `machine ${m.status}`;\n    li.append(`${m.name} — ${m.department} `);\n    const badge = document.createElement("span");\n    badge.className = "badge";\n    badge.textContent = m.status;\n    li.append(badge);\n    list.append(li);\n  }\n  summary.textContent = `Showing ${shown.length} of ${machines.length} machines`;\n}\nfor (const button of document.querySelectorAll(".filter")) {\n  button.addEventListener("click", () => {\n    filter = button.dataset.status;\n    localStorage.setItem(KEY, filter);\n    render();\n  });\n}\nasync function load() {\n  state.textContent = "Loading machines...";\n  const response = await fetch("/api/machines");\n  if (!response.ok) {\n    state.textContent = `Could not load machines (status ${response.status})`;\n    render();\n    return;\n  }\n  machines = await response.json();\n  state.textContent = "";\n  render();\n}\nload();\n';
const dash = F(dashHtml, dashCss, dashJs);

/* ------------------------------------------------------------ B: study planner */
const planHtml = '<main>\n  <h1>Study Planner</h1>\n  <form id="task-form" novalidate>\n    <label for="title">Task</label>\n    <input id="title" name="title" autocomplete="off">\n    <label for="priority">Priority</label>\n    <select id="priority">\n      <option value="low">Low</option>\n      <option value="medium" selected>Medium</option>\n      <option value="high">High</option>\n    </select>\n    <button type="submit">Add task</button>\n    <p id="error" role="alert"></p>\n  </form>\n  <label for="view">Show</label>\n  <select id="view">\n    <option value="all">All</option>\n    <option value="open">Open</option>\n    <option value="done">Done</option>\n  </select>\n  <p id="summary"></p>\n  <ul id="tasks"></ul>\n</main>\n';
const planCss = '* { box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }\n#task-form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }\n#error { flex-basis: 100%; margin: 0; color: #b00020; }\n@media (max-width: 499px) {\n  #task-form { flex-direction: column; align-items: stretch; }\n}\n#tasks { list-style: none; padding: 0; }\n.task { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin-bottom: 6px; border: 1px solid #dddddd; border-left: 4px solid #dddddd; }\n.task[data-priority="high"] { border-left: 4px solid #b00020; }\n.task.done .title { text-decoration: line-through; color: #666666; }\n';
const planJs = 'const KEY = "tasks";\nconst PRIORITIES = ["high", "medium", "low"];\nconst form = document.querySelector("#task-form");\nconst titleBox = document.querySelector("#title");\nconst error = document.querySelector("#error");\nconst view = document.querySelector("#view");\nconst summary = document.querySelector("#summary");\nconst list = document.querySelector("#tasks");\n\nfunction load() {\n  try {\n    const data = JSON.parse(localStorage.getItem(KEY));\n    if (!Array.isArray(data)) return [];\n    return data\n      .filter((t) => t && typeof t.title === "string" && t.title.trim() !== "" && PRIORITIES.includes(t.priority) && typeof t.done === "boolean")\n      .map((t) => ({ title: t.title, priority: t.priority, done: t.done }));\n  } catch {\n    return [];\n  }\n}\nlet tasks = load();\n\nfunction save() {\n  localStorage.setItem(KEY, JSON.stringify(tasks));\n}\nfunction render() {\n  const shown = tasks.filter((t) => view.value === "all" || (view.value === "done") === t.done);\n  shown.sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));\n  list.replaceChildren();\n  for (const task of shown) {\n    const li = document.createElement("li");\n    li.className = task.done ? "task done" : "task";\n    li.dataset.priority = task.priority;\n    const label = document.createElement("label");\n    const box = document.createElement("input");\n    box.type = "checkbox";\n    box.checked = task.done;\n    box.addEventListener("change", () => {\n      task.done = box.checked;\n      save();\n      render();\n    });\n    const title = document.createElement("span");\n    title.className = "title";\n    title.textContent = task.title;\n    label.append(box, title);\n    const remove = document.createElement("button");\n    remove.className = "delete";\n    remove.textContent = "×";\n    remove.setAttribute("aria-label", `Delete ${task.title}`);\n    remove.addEventListener("click", () => {\n      tasks = tasks.filter((t) => t !== task);\n      save();\n      render();\n    });\n    li.append(label, remove);\n    list.append(li);\n  }\n  const done = tasks.filter((t) => t.done).length;\n  summary.textContent = `${tasks.length - done} open, ${done} done`;\n}\nform.addEventListener("submit", (event) => {\n  event.preventDefault();\n  const title = titleBox.value.trim();\n  let message = "";\n  if (title === "") message = "Task needs a title";\n  else if (title.length < 3) message = "Title must be at least 3 characters";\n  else if (tasks.some((t) => t.title.toLowerCase() === title.toLowerCase())) message = "That task already exists";\n  error.textContent = message;\n  if (message) return;\n  tasks.push({ title, priority: document.querySelector("#priority").value, done: false });\n  titleBox.value = "";\n  save();\n  render();\n});\nview.addEventListener("change", render);\nrender();\n';
const plan = F(planHtml, planCss, planJs);

/* ------------------------------------------------------------ C: stats explorer */
const statsHtml = '<main>\n  <h1>League Stats</h1>\n  <label for="team">Team</label>\n  <select id="team"><option value="">All teams</option></select>\n  <p id="state" role="status"></p>\n  <p id="count"></p>\n  <table id="players">\n    <caption>Players</caption>\n    <thead>\n      <tr>\n        <th scope="col" aria-sort="none"><button data-sort="name">Name</button></th>\n        <th scope="col">Team</th>\n        <th scope="col">Pos</th>\n        <th scope="col" aria-sort="none"><button data-sort="batting_avg">AVG</button></th>\n        <th scope="col" aria-sort="none"><button data-sort="home_runs">HR</button></th>\n      </tr>\n    </thead>\n    <tbody></tbody>\n  </table>\n</main>\n';
const statsCss = '* { box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }\ntable { border-collapse: collapse; width: 100%; }\nthead tr { background: #1a3a6b; }\nthead th { color: #ffffff; padding: 6px 8px; text-align: left; }\nthead button { color: inherit; background: none; border: 0; font: inherit; cursor: pointer; }\ntbody tr:nth-child(odd) { background: #f2f5fa; }\ntbody tr:nth-child(even) { background: #ffffff; }\ntd { padding: 6px 8px; }\ntd:nth-child(4), td:nth-child(5), th:nth-child(4), th:nth-child(5) { text-align: right; }\n';
const statsJs = 'const select = document.querySelector("#team");\nconst state = document.querySelector("#state");\nconst count = document.querySelector("#count");\nconst body = document.querySelector("#players tbody");\nconst headers = [...document.querySelectorAll("#players thead th")];\nlet players = [];\nlet team = "";\nlet sort = { key: null, dir: 1 };\n\nconst average = (n) => n.toFixed(3).replace(/^0/, "");\n\nasync function getJson(url) {\n  const response = await fetch(url);\n  if (!response.ok) throw Object.assign(new Error("http"), { status: response.status });\n  return response.json();\n}\nfunction render() {\n  const rows = [...players];\n  if (sort.key) {\n    rows.sort((a, b) => {\n      const x = a[sort.key];\n      const y = b[sort.key];\n      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;\n    });\n  }\n  for (const th of headers) {\n    const button = th.querySelector("button");\n    if (!button) continue;\n    th.setAttribute("aria-sort", button.dataset.sort !== sort.key ? "none" : sort.dir === 1 ? "ascending" : "descending");\n  }\n  body.replaceChildren();\n  for (const p of rows) {\n    const tr = document.createElement("tr");\n    for (const value of [p.name, p.team, p.position, average(p.batting_avg), p.home_runs]) {\n      const td = document.createElement("td");\n      td.textContent = value;\n      tr.append(td);\n    }\n    body.append(tr);\n  }\n  if (rows.length === 0) count.textContent = `No players for ${team}`;\n  else count.textContent = rows.length === 1 ? "1 player" : `${rows.length} players`;\n}\nasync function loadPlayers() {\n  players = await getJson(team ? `/api/players?team=${encodeURIComponent(team)}` : "/api/players");\n  render();\n}\nselect.addEventListener("change", async () => {\n  team = select.value;\n  sort = { key: null, dir: 1 };\n  try {\n    await loadPlayers();\n  } catch (e) {\n    state.textContent = `Could not load data (status ${e.status})`;\n  }\n});\nfor (const button of document.querySelectorAll("#players button[data-sort]")) {\n  button.addEventListener("click", () => {\n    const key = button.dataset.sort;\n    sort = sort.key === key && sort.dir === 1 ? { key, dir: -1 } : { key, dir: 1 };\n    render();\n  });\n}\nasync function start() {\n  state.textContent = "Loading...";\n  try {\n    const teams = await getJson("/api/teams");\n    for (const name of teams.map((t) => t.name).sort()) select.append(new Option(name, name));\n    await loadPlayers();\n    state.textContent = "";\n  } catch (e) {\n    state.textContent = `Could not load data (status ${e.status})`;\n  }\n}\nstart();\n';
const stats = F(statsHtml, statsCss, statsJs);

Object.assign(projectSolutions, {
  'web-25-machine-dashboard': {
    valid: [dash],
    wrong: [
      rep(dash, 'js', '    localStorage.setItem(KEY, filter);\n', ''),
      rep(dash, 'js', '    button.textContent = `${status[0].toUpperCase()}${status.slice(1)} (${count})`;\n', ''),
      rep(dash, 'js', '    button.setAttribute("aria-pressed", String(status === filter));\n', ''),
      rep(dash, 'js', 'return value === "all" || STATUSES.includes(value) ? value : "all";', 'return value || "all";'),
      rep(dash, 'js', '  if (!response.ok) {\n    state.textContent = `Could not load machines (status ${response.status})`;\n    render();\n    return;\n  }\n', ''),
      rep(dash, 'css', '.down .badge { background: #b00020; }\n', ''),
      rep(dash, 'css', 'grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))', 'grid-template-columns: 1fr'),
      rep(dash, 'html', ' aria-label="Filter machines"', ''),
      rep(dash, 'html', ' role="status"', ''),
      rep(dash, 'js', '`Showing ${shown.length} of ${machines.length} machines`', '`Showing ${shown.length} machines`'),
      rep(dash, 'js', 'const shown = filter === "all" ? machines : machines.filter((m) => m.status === filter);', 'const shown = filter === "all" ? machines : machines.filter((m) => m.status !== filter);'),
      rep(dash, 'js', '  state.textContent = "Loading machines...";\n', ''),
      rep(dash, 'css', '.filter[aria-pressed="true"] { font-weight: bold; background: #1a3a6b; color: #fff; }\n', ''),
      rep(dash, 'css', '.machine { border: 1px solid #cccccc; border-radius: 6px; padding: 12px; }\n', '.machine { border: 1px solid #cccccc; border-radius: 6px; padding: 12px; min-width: 500px; }\n'),
    ],
  },
  'web-25-study-planner': {
    valid: [plan],
    wrong: [
      rep(plan, 'js', '  event.preventDefault();\n', ''),
      rep(plan, 'js', 'else if (title.length < 3)', 'else if (title.length < 2)'),
      rep(plan, 'js', 'tasks.some((t) => t.title.toLowerCase() === title.toLowerCase())', 'tasks.some((t) => t.title === title)'),
      rep(plan, 'js', 'const title = titleBox.value.trim();', 'const title = titleBox.value;'),
      rep(plan, 'js', '  shown.sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));\n', ''),
      rep(plan, 'js', 'PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)', 'PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority)'),
      rep(plan, 'js', '      task.done = box.checked;\n      save();\n', '      task.done = box.checked;\n'),
      rep(plan, 'js', '      tasks = tasks.filter((t) => t !== task);\n      save();\n', '      tasks = tasks.filter((t) => t !== task);\n'),
      rep(plan, 'js', 'const done = tasks.filter((t) => t.done).length;', 'const done = shown.filter((t) => t.done).length;'),
      rep(plan, 'js', ' && typeof t.done === "boolean"', ''),
      rep(plan, 'js', ' && PRIORITIES.includes(t.priority)', ''),
      rep(plan, 'js', '  } catch {\n    return [];\n  }', '  } finally {\n  }'),
      rep(plan, 'js', '  titleBox.value = "";\n', ''),
      rep(plan, 'js', '  error.textContent = message;\n  if (message) return;', '  if (message) { error.textContent = message; return; }'),
      rep(plan, 'js', '    remove.setAttribute("aria-label", `Delete ${task.title}`);\n', ''),
      rep(plan, 'html', ' role="alert"', ''),
      rep(plan, 'html', '    <label for="title">Task</label>\n', ''),
      rep(plan, 'css', '  #task-form { flex-direction: column; align-items: stretch; }', '  #task-form { display: flex; }'),
      rep(plan, 'css', '.task[data-priority="high"] { border-left: 4px solid #b00020; }\n', ''),
      rep(plan, 'css', '.task.done .title { text-decoration: line-through; color: #666666; }\n', '.task.done .title { color: #666666; }\n'),
    ],
  },
  'web-25-stats-explorer': {
    valid: [stats],
    wrong: [
      rep(stats, 'js', 'return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;', 'return String(x).localeCompare(String(y)) * sort.dir;'),
      rep(stats, 'js', 'sort = sort.key === key && sort.dir === 1 ? { key, dir: -1 } : { key, dir: 1 };', 'sort = { key, dir: 1 };'),
      rep(stats, 'js', '    th.setAttribute("aria-sort", button.dataset.sort !== sort.key ? "none" : sort.dir === 1 ? "ascending" : "descending");\n', ''),
      rep(stats, 'js', '  sort = { key: null, dir: 1 };\n  try {', '  try {'),
      rep(stats, 'js', 'rows.length === 1 ? "1 player" : `${rows.length} players`', '`${rows.length} players`'),
      rep(stats, 'js', 'if (rows.length === 0) count.textContent = `No players for ${team}`;\n  else count.textContent', 'count.textContent'),
      rep(stats, 'js', 'average(p.batting_avg)', 'p.batting_avg'),
      rep(stats, 'js', 'encodeURIComponent(team)', 'team.toLowerCase()'),
      rep(stats, 'js', 'teams.map((t) => t.name).sort()', 'teams.map((t) => t.name)'),
      rep(stats, 'js', '  state.textContent = "Loading...";\n', ''),
      rep(stats, 'js', '    state.textContent = `Could not load data (status ${e.status})`;\n  }\n}\nstart();', '    state.textContent = "Could not load data";\n  }\n}\nstart();'),
      rep(stats, 'html', ' role="status"', ''),
      rep(stats, 'html', '    <caption>Players</caption>\n', ''),
      rep(stats, 'html', '<th scope="col">Team</th>', '<th>Team</th>'),
      rep(stats, 'html', '  <label for="team">Team</label>\n', ''),
      rep(stats, 'css', 'thead tr { background: #1a3a6b; }\n', ''),
      rep(stats, 'css', 'tbody tr:nth-child(odd) { background: #f2f5fa; }\n', 'tbody tr:nth-child(even) { background: #f2f5fa; }\n'),
      rep(stats, 'css', 'td:nth-child(4), td:nth-child(5), th:nth-child(4), th:nth-child(5) { text-align: right; }\n', ''),
    ],
  },
});
