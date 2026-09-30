import type { WebFiles } from '../schema';
import type { Sol } from './solutions.testdata';

const fc = (html: string, css: string): WebFiles => ({ html, css, js: '' });

const REPORT = '<h1>Pump Station Report</h1>\n<p>All pumps were inspected on Monday.</p>\n<p class="warning">Pump 3 is leaking.</p>\n<p>Next inspection is due in June.</p>\n';
const MACHINES = '<ul id="machines">\n  <li class="machine running"><a href="press.html">Press 1</a></li>\n  <li class="machine down"><a href="lathe.html">Lathe</a></li>\n  <li class="machine idle"><a href="welder.html">Welder</a></li>\n</ul>\n<p><a href="help.html">Help</a></p>\n';
const TABLE = '<table>\n  <thead><tr><th>Team</th><th>Points</th></tr></thead>\n  <tbody>\n    <tr class="champion"><td>Owls</td><td>24</td></tr>\n    <tr><td>Bears</td><td>18</td></tr>\n    <tr><td>Cats</td><td>9</td></tr>\n    <tr><td>Wolves</td><td>7</td></tr>\n  </tbody>\n</table>\n';
const CARDS = '<div class="card">\n  <h3>Gloves</h3>\n  <span class="badge">SALE</span>\n  <p class="price">£4.50</p>\n</div>\n<div class="card sale">\n  <h3>Helmet</h3>\n  <span class="badge">SALE</span>\n  <p class="price">£19.99</p>\n</div>\n';
const ALERT = '<div class="panel">\n  <p class="note">Pressure normal.</p>\n  <p id="msg" class="note alert">Leak detected!</p>\n  <p class="note">Valve closed.</p>\n</div>\n';
const PIT = '<ol class="board">\n  <li class="lap">Lap 41: 1:22.4</li>\n  <li class="lap leader" id="p1">Lap 42: 1:21.9</li>\n  <li class="lap">Lap 43: 1:22.7</li>\n</ol>\n';

const reportCss = 'h1 { color: #1a3a6b; font-size: 2rem; }\np { color: #333333; line-height: 1.6; }\n.warning { color: #b00020; font-weight: bold; }\n';
const machineCss = '.running { color: #1b7f3b; }\n.down { color: #c0392b; font-weight: bold; }\n.idle { color: #7f8c8d; font-style: italic; }\n#machines li { padding: 8px; }\n#machines li:first-child { border-top: 1px solid #cccccc; }\n#machines a { color: inherit; text-decoration: none; }\n';
const tableCss = 'thead th { color: #fff; background: #222222; }\ntbody tr:nth-child(even) { background: #f2f2f2; }\ntr > :last-child { text-align: right; }\n.champion { font-weight: bold; }\ntbody td { padding: 6px 0; }\n';
const cardCss = '.price { color: #b12704; font-size: 1.25rem; }\n.card.sale .price { color: #cc0c39; font-weight: bold; }\n.card:not(.sale) .badge { display: none; }\n.card h3 { margin: 0 0 8px; }\n';

export const cssSolutions: Record<string, Sol> = {
  'web-08-style-report': {
    valid: [fc(REPORT, reportCss), fc(REPORT, 'h1{color:rgb(26,58,107);font-size:32px}p{color:#333;line-height:1.6}p.warning{color:#b00020;font-weight:700}')],
    wrong: [fc(REPORT, reportCss.replace('2rem', '2em').replace('font-size: 2em', 'font-size: 3rem')), fc(REPORT, reportCss.replace('line-height: 1.6', 'line-height: 1.6px')), fc(REPORT, reportCss.replace('.warning {', 'warning {')), fc(REPORT, reportCss.replace('#333333', '#444444')), fc(REPORT, reportCss.replace('font-weight: bold', 'font-style: italic')), fc(REPORT, reportCss.replace('p {', 'p, .warning {').replace('.warning { color: #b00020; font-weight: bold; }', ''))],
  },
  'web-08-machine-status': {
    valid: [fc(MACHINES, machineCss)],
    wrong: [fc(MACHINES, machineCss.replace('.running { color: #1b7f3b; }', '.running { color: #1b7f3c; }')), fc(MACHINES, machineCss.replace('font-weight: bold', 'font-weight: normal')), fc(MACHINES, machineCss.replace('li:first-child', 'li')), fc(MACHINES, machineCss.replace('#machines a', 'a')), fc(MACHINES, machineCss.replace('color: inherit; ', '')), fc(MACHINES, machineCss.replace('padding: 8px', 'padding: 8px 0')), fc(MACHINES, machineCss.replace('font-style: italic', 'font-style: normal'))],
  },
  'web-08-score-table': {
    valid: [fc(TABLE, tableCss), fc(TABLE, tableCss.replace('tbody tr:nth-child(even)', 'tr:nth-child(even)'))],
    wrong: [fc(TABLE, tableCss.replace('even', 'odd')), fc(TABLE, tableCss.replace('background: #222222', 'background: #333333')), fc(TABLE, tableCss.replace('tr > :last-child', 'td')), fc(TABLE, tableCss.replace('.champion { font-weight: bold; }', '')), fc(TABLE, tableCss.replace('padding: 6px 0', 'padding: 6px 0 0'))],
  },
  'web-08-product-cards': {
    valid: [fc(CARDS, cardCss)],
    wrong: [fc(CARDS, cardCss.replace('.card.sale .price', '.card .sale .price')), fc(CARDS, cardCss.replace('font-size: 1.25rem', 'font-size: 1.5rem')), fc(CARDS, cardCss.replace('.card:not(.sale) .badge { display: none; }', '.badge { display: none; }')), fc(CARDS, cardCss.replace('margin: 0 0 8px', 'margin: 8px 0 0')), fc(CARDS, cardCss.replace('font-weight: bold', 'font-weight: 400'))],
  },
  'web-08-specificity-alert': {
    valid: [fc(ALERT, '.panel p { color: #1b7f3b; }\n#msg { color: #c0392b; }\np.note { color: #1b7f3b; }\n'), fc(ALERT, '.panel p { color: #1b7f3b; }\n.alert#msg { color: #c0392b; }\np.note { color: #1b7f3b; }\n')],
    wrong: [fc(ALERT, '.panel p { color: #1b7f3b; }\n#msg { color: #c0392b !important; }\np.note { color: #1b7f3b; }\n'), fc(ALERT, '.panel p { color: #1b7f3b; }\n#msg { color: #2255cc; }\np.note { color: #1b7f3b; }\n'), fc(ALERT, '.panel p { color: #1b7f3b; }\n#msg { color: #c0392b; }\np.note { color: purple; }\n'), fc(ALERT, '#msg { color: #c0392b; }\n.panel p { color: #c0392b; }\n')],
  },
  'web-08-specificity-pit': {
    valid: [fc(PIT, '.board li { color: #ffffff; }\n#p1 { color: #7b2fbf; }\nli.lap { color: #ffffff; }\n')],
    wrong: [fc(PIT, '.board li { color: #ffffff; }\n#p1 { color: #7b2fbf !important; }\nli.lap { color: #ffffff; }\n'), fc(PIT, '.board li { color: #ffffff; }\n#p1 { color: #f39c12; }\nli.lap { color: #ffffff; }\n'), fc(PIT, '.board li { color: #ffffff; }\n#p1 { color: #7b2fbf; }\nli.lap { color: #cccccc; }\n'), fc(PIT, '.leader { color: #7b2fbf; }\n.lap { color: #ffffff; }\n#p1 { color: #f39c12; }\n')],
  },
};

const CARD = '<div class="card">Bytehaven Works: welcome</div>\n';
const BANNER = '<div class="wrap">\n  <div class="banner"><p>Coolant low</p></div>\n  <div class="banner"><p>Door open</p></div>\n</div>\n';
const TILES = '<div class="tile">Output<br>1,240</div>\n<div class="tile">Defects<br>12</div>\n<div class="tile">Uptime<br>97%</div>\n';
const BOARD = '<div class="board">LAP 42 &middot; P2 &middot; +1.4s</div>\n';
const boxCardCss = '.card { width: 300px; box-sizing: border-box; padding: 16px; border: 2px solid #333333; background: #ffffff; margin: 20px auto; }\n';
const bannerCss = '.wrap { width: 600px; }\n.banner { box-sizing: border-box; width: 100%; background: #fdecea; padding: 12px 20px; border-left: 6px solid #c0392b; margin-bottom: 16px; }\n.banner p { margin: 0; }\n';
const tileCss = 'body { margin: 0; }\n.tile { display: inline-block; box-sizing: border-box; width: 200px; height: 120px; padding: 12px; border: 1px solid #999999; margin: 8px; vertical-align: top; }\n';
const boardCss = '.board { background: #ffd54f; width: 400px; padding: 20px; border: 5px solid #111111; margin: 30px auto 0; }\n';
Object.assign(cssSolutions, {
  'web-09-card-box': {
    valid: [fc(CARD, boxCardCss), fc(CARD, '* { box-sizing: border-box; }\n.card { width: 300px; padding: 16px; border: 2px solid #333; background: white; margin: 20px auto; }')],
    wrong: [fc(CARD, boxCardCss.replace('box-sizing: border-box; ', '')), fc(CARD, boxCardCss.replace('20px auto', '20px 0')), fc(CARD, boxCardCss.replace('padding: 16px', 'padding: 20px')), fc(CARD, boxCardCss.replace('2px solid #333333', '3px solid #333333')), fc(CARD, boxCardCss.replace('#ffffff', '#eeeeee')), fc(CARD, boxCardCss.replace('width: 300px', 'width: 320px'))],
  },
  'web-09-alert-banner': {
    valid: [fc(BANNER, bannerCss), fc(BANNER, bannerCss.replace('margin-bottom: 16px', 'margin: 16px 0')), fc(BANNER, '.wrap { width: 600px; }\n.banner { width: 100%; background: #fdecea; padding: 12px 20px; border-left: 6px solid #c0392b; margin-bottom: 16px; box-sizing: border-box; }\n.banner p { margin: 0 }\n.banner:last-child { margin-bottom: 0 }\n')],
    wrong: [fc(BANNER, bannerCss.replace('box-sizing: border-box; ', '')), fc(BANNER, bannerCss.replace('margin-bottom: 16px', 'margin-bottom: 8px')), fc(BANNER, bannerCss.replace('.banner p { margin: 0; }', '')), fc(BANNER, bannerCss.replace('border-left: 6px', 'border: 6px')), fc(BANNER, bannerCss.replace('12px 20px', '12px'))],
  },
  'web-09-stat-tiles': {
    valid: [fc(TILES, tileCss), fc(TILES, tileCss.replace('vertical-align: top;', ''))],
    wrong: [fc(TILES, tileCss.replace('display: inline-block', 'display: block')), fc(TILES, tileCss.replace('display: inline-block', 'display: inline')), fc(TILES, tileCss.replace('box-sizing: border-box; ', '')), fc(TILES, tileCss.replace('margin: 8px', 'margin: 4px')), fc(TILES, tileCss.replace('height: 120px', 'height: 100px')), fc(TILES, tileCss.replace('1px solid #999999', '2px solid #999999'))],
  },
  'web-09-pit-board': {
    valid: [fc(BOARD, boardCss), fc(BOARD, '.board { background: #ffd54f; box-sizing: content-box; width: 400px; padding: 20px; border: 5px solid #111; margin: 30px auto 30px; }')],
    wrong: [fc(BOARD, boardCss.replace('width: 400px;', 'width: 400px; box-sizing: border-box;')), fc(BOARD, boardCss.replace('width: 400px', 'width: 450px')), fc(BOARD, boardCss.replace('30px auto 0', '0 auto')), fc(BOARD, boardCss.replace('30px auto 0', '30px 0 0')), fc(BOARD, boardCss.replace('padding: 20px', 'padding: 10px')), fc(BOARD, boardCss.replace('5px solid #111111', '5px solid #222222'))],
  },
});

const BAR = '<nav class="bar">\n  <a href="#">Home</a>\n  <a href="#">Machines</a>\n  <a href="#">Reports</a>\n  <a href="#" class="login">Log in</a>\n</nav>\n';
const TOOLBAR = '<div class="toolbar">\n  <button>Start</button>\n  <button>Stop</button>\n  <button>Reset</button>\n  <button>Alarm</button>\n</div>\n';
const PLAYER = '<div class="player">\n  <div class="photo">photo</div>\n  <div class="info">\n    <h3>Ada Reyes</h3>\n    <p>Owls · Shortstop · .312 avg</p>\n  </div>\n</div>\n';
const STEPS = '<div class="steps">\n  <div class="step">Tyres off</div>\n  <div class="step">Refuel</div>\n  <div class="step">Tyres on</div>\n</div>\n';
const barBase = '.bar { height: 80px; background: #eeeeee; }\n.bar a { padding: 0; }\n';
const barCss = barBase + '.bar { display: flex; align-items: center; gap: 16px; }\n.login { margin-left: auto; }\n';
const tbBase = '.toolbar { width: 600px; background: #ddd; }\n.toolbar button { height: 48px; padding: 0; border: 0; }\n';
const tbCss = tbBase + '.toolbar { display: flex; gap: 8px; }\n.toolbar button { flex: 1; }\n';
const plBase = '.player { width: 500px; background: #eef; }\n.photo { width: 96px; height: 96px; background: #99a; }\n.info h3, .info p { margin: 0; }\n';
const plCss = plBase + '.player { display: flex; gap: 12px; align-items: flex-start; }\n.photo { flex: none; }\n.info { flex: 1; }\n';
const stBase = '.steps { width: 600px; height: 100px; background: #222; }\n.step { width: 120px; height: 40px; background: #f39c12; }\n';
const stCss = stBase + '.steps { display: flex; justify-content: space-between; align-items: center; }\n';
Object.assign(cssSolutions, {
  'web-10-nav-bar': {
    valid: [fc(BAR, barCss), fc(BAR, barBase + '.bar { display: flex; align-items: center; column-gap: 16px; }\n.bar a:last-child { margin-left: auto; }\n')],
    wrong: [fc(BAR, barBase + '.bar { display: flex; gap: 16px; }\n.login { margin-left: auto; }\n'), fc(BAR, barBase + '.bar { display: flex; align-items: center; gap: 16px; }\n'), fc(BAR, barBase + '.bar { display: flex; align-items: center; gap: 8px; }\n.login { margin-left: auto; }\n'), fc(BAR, barBase + '.bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }\n'), fc(BAR, barBase + '.bar { align-items: center; gap: 16px; }\n.login { margin-left: auto; }\n'), fc(BAR, barBase + '.bar { display: flex; align-items: center; gap: 16px; }\n.login { margin-right: auto; }\n')],
  },
  'web-10-toolbar': {
    valid: [fc(TOOLBAR, tbCss), fc(TOOLBAR, tbBase + '.toolbar { display: flex; gap: 8px; }\n.toolbar button { flex: 1 1 0; }\n')],
    wrong: [fc(TOOLBAR, tbBase + '.toolbar { display: flex; gap: 8px; }\n'), fc(TOOLBAR, tbBase + '.toolbar { display: flex; justify-content: space-between; }\n.toolbar button { flex: 1; }\n'), fc(TOOLBAR, tbBase + '.toolbar { display: flex; gap: 16px; }\n.toolbar button { flex: 1; }\n'), fc(TOOLBAR, tbBase + '.toolbar { gap: 8px; }\n.toolbar button { flex: 1; }\n'), fc(TOOLBAR, tbBase + '.toolbar { display: flex; gap: 8px; }\n.toolbar button:first-child { flex: 2; }\n.toolbar button { flex: 1; }\n')],
  },
  'web-10-player-card': {
    valid: [fc(PLAYER, plCss), fc(PLAYER, plBase + '.player { display: flex; gap: 12px; }\n.photo { flex: none; }\n.info { flex: 1; }\n'), fc(PLAYER, plBase + '.player { display: flex; column-gap: 12px; align-items: flex-start; }\n.photo { flex-shrink: 0; }\n.info { flex-grow: 1; }\n')],
    wrong: [fc(PLAYER, plBase + '.player { display: flex; gap: 12px; align-items: flex-start; }\n.info { flex: 1; }\n.photo { flex: 1; }\n'), fc(PLAYER, plBase + '.player { display: flex; gap: 12px; align-items: flex-start; }\n.photo { flex: none; }\n'), fc(PLAYER, plBase + '.player { display: flex; gap: 20px; align-items: flex-start; }\n.photo { flex: none; }\n.info { flex: 1; }\n'), fc(PLAYER, plBase + '.player { display: block; }\n.photo { float: left; }\n'), fc(PLAYER, plBase + '.player { display: flex; gap: 12px; align-items: center; }\n.photo { flex: none; }\n.info { flex: 1; }\n')],
  },
  'web-10-pit-steps': {
    valid: [fc(STEPS, stCss), fc(STEPS, stBase + '.steps { display: flex; justify-content: space-between; align-items: center; }\n')],
    wrong: [fc(STEPS, stBase + '.steps { display: flex; justify-content: space-around; align-items: center; }\n'), fc(STEPS, stBase + '.steps { display: flex; justify-content: space-between; }\n'), fc(STEPS, stBase + '.steps { display: flex; justify-content: center; align-items: center; gap: 20px; }\n'), fc(STEPS, stBase + '.steps { display: flex; align-items: center; }\n'), fc(STEPS, stBase + '.steps { display: flex; justify-content: space-between; align-items: center; }\n.step { flex: 1; }\n')],
  },
});

const STATS = '<div class="stats">\n  <div class="box">Output</div>\n  <div class="box wide">Quality</div>\n  <div class="box">Defects</div>\n  <div class="box">Uptime</div>\n  <div class="box">Energy</div>\n  <div class="box">Scrap</div>\n</div>\n';
const PAGE = '<div class="page">\n  <header>Header</header>\n  <nav>Menu</nav>\n  <main>Main content</main>\n  <footer>Footer</footer>\n</div>\n';
const TILES2 = '<div class="tiles">\n  <div class="tile">Bolts</div><div class="tile">Nuts</div><div class="tile">Gears</div><div class="tile">Belts</div>\n  <div class="tile">Hoses</div><div class="tile">Valves</div><div class="tile">Gauges</div><div class="tile">Filters</div>\n</div>\n';
const HUD = '<div class="hud">\n  <div class="score">Score 1200</div>\n  <div class="health">Health 80</div>\n  <div class="ammo">Ammo 24</div>\n  <div class="map">Map</div>\n</div>\n';
const stBase2 = '.stats { width: 600px; }\n.box { background: #dde; padding: 8px; }\n';
const pgBase = '.page { width: 800px; }\nheader, nav, main, footer { background: #dde; padding: 8px; }\n';
const tlBase = '.tiles { max-width: 620px; }\n.tile { background: #dde; padding: 12px; }\n';
const hdBase = '.hud { width: 600px; }\n.hud div { background: #223; color: #fff; padding: 8px; }\n';
Object.assign(cssSolutions, {
  'web-11-stat-grid': {
    valid: [fc(STATS, stBase2 + '.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }\n.wide { grid-column: span 2; }\n'), fc(STATS, stBase2 + '.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; row-gap: 12px; column-gap: 12px; }\n.wide { grid-column: 2 / 4; }\n')],
    wrong: [fc(STATS, stBase2 + '.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }\n'), fc(STATS, stBase2 + '.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }\n.wide { grid-column: span 2; }\n'), fc(STATS, stBase2 + '.stats { display: grid; grid-template-columns: repeat(3, 1fr); }\n.wide { grid-column: span 2; }\n'), fc(STATS, stBase2 + '.stats { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; }\n.wide { grid-column: span 2; }\n'), fc(STATS, stBase2 + '.stats { display: flex; gap: 12px; flex-wrap: wrap; }\n.box { width: 30%; }\n.wide { width: 60%; }\n')],
  },
  'web-11-dashboard-layout': {
    valid: [fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 25% 1fr; gap: 10px; }\nheader, footer { grid-column: 1 / -1; }\n'), fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }\nheader, footer { grid-column: 1 / -1; }\n'), fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 200px 1fr; gap: 10px; grid-template-areas: "h h" "n m" "f f"; }\nheader { grid-area: h; } nav { grid-area: n; } main { grid-area: m; } footer { grid-area: f; }\n')],
    wrong: [fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }\n'), fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\nheader, footer { grid-column: 1 / -1; }\n'), fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 200px 1fr; }\nheader, footer { grid-column: 1 / -1; }\n'), fc(PAGE, pgBase + '.page { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }\nheader { grid-column: 1 / -1; }\n')],
  },
  'web-11-inventory-tiles': {
    valid: [fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }\n'), fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }\n')],
    wrong: [fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }\n'), fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(auto-fill, 140px); gap: 10px; }\n'), fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }\n'), fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }\n'), fc(TILES2, tlBase + '.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; }\n')],
  },
  'web-11-game-hud': {
    valid: [fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }\n.score, .map { grid-column: 1 / -1; }\n.map { height: 120px; box-sizing: border-box; }\n'), fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; grid-template-rows: auto auto 120px; }\n.score, .map { grid-column: span 2; }\n')],
    wrong: [fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }\n.score { grid-column: 1 / -1; }\n.map { height: 120px; }\n'), fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }\n.score, .map { grid-column: 1 / -1; }\n'), fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: repeat(2, 1fr); }\n.score, .map { grid-column: 1 / -1; }\n.map { height: 120px; }\n'), fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }\n.score, .map { grid-column: 1 / -1; }\n.map { height: 120px; }\n'), fc(HUD, hdBase + '.hud { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }\n.score, .map { grid-column: 1 / -1; }\n.map { height: 120px; }\n')],
  },
});

const CARDS3 = '<div class="cards">\n  <div class="card">Machines</div>\n  <div class="card">Alerts</div>\n  <div class="card">Reports</div>\n</div>\n';
const ITEM = '<div class="item">\n  <div class="pic">img</div>\n  <div class="info"><h3>Safety gloves</h3><p>Stock: 120 pairs, aisle 4, shelf C. Reorder when below 40.</p></div>\n</div>\n';
const TOP = '<header class="top">\n  <div class="brand">Ada Reyes</div>\n  <ul class="menu">\n    <li><a href="#work">Work</a></li>\n    <li><a href="#about">About</a></li>\n    <li><a href="#contact">Contact</a></li>\n  </ul>\n</header>\n<div class="hero">hero image</div>\n';
const BOARD3 = '<div class="board">\n  <div class="team">Owls 5</div>\n  <div class="team">Bears 3</div>\n  <div class="team">Cats 2</div>\n  <div class="team">Wolves 1</div>\n</div>\n';
const WARN = '<p class="warning">Isolate the power supply first.</p>\n<p>Normal note.</p>\n<ul class="checks">\n  <li>Check the guard</li>\n  <li>Check the oil</li>\n  <li>Clamp the workpiece</li>\n</ul>\n<button disabled>Start</button> <button>Stop</button>\n';
const SCHED = '<ol class="schedule">\n  <li class="session">Practice 1</li>\n  <li class="session">Practice 2</li>\n  <li class="session live">Qualifying</li>\n  <li class="session">Race</li>\n</ol>\n';
const cdBase = '.card { background: #dde; padding: 16px; }\n';
const cdCss = cdBase + '.cards { display: grid; gap: 12px; }\n@media (min-width: 700px) {\n  .cards { grid-template-columns: repeat(3, 1fr); }\n}\n';
const itBase = '.item { border: 1px solid #ccc; padding: 8px; }\n.pic { width: 80px; height: 80px; background: #99a; }\n';
const itCss = itBase + '.item { display: flex; flex-direction: column; gap: 16px; }\n.pic { flex: none; }\n@media (min-width: 600px) {\n  .item { flex-direction: row; }\n  .info { flex: 1; }\n}\n';
const tpBase = '.menu { list-style: none; margin: 0; padding: 0; }\n.brand { font-weight: 700; }\n.hero { width: 1200px; height: 200px; background: #cde; }\n';
const tpCss = tpBase + '.hero { max-width: 100%; }\n.top { display: flex; flex-direction: column; }\n@media (min-width: 640px) {\n  .top { flex-direction: row; justify-content: space-between; align-items: center; }\n}\n.menu a { display: block; }\n@media (min-width: 640px) { .menu { display: flex; gap: 16px; } .menu a { display: inline; } }\n';
const bdBase = '.team { background: #223; color: #fff; padding: 12px; }\n';
const bdCss = bdBase + '.board { display: grid; gap: 10px; }\n@media (min-width: 500px) { .board { grid-template-columns: repeat(2, 1fr); } }\n@media (min-width: 800px) { .board { grid-template-columns: repeat(4, 1fr); } }\n';
const wnCss = '.warning::before { content: "WARNING: "; color: #b00020; font-weight: bold; }\n.checks li:not(:last-child)::after { content: ";"; }\n.checks li:last-child::after { content: "."; }\nbutton:disabled { color: #999999; }\n';
const scCss = '.session::before { content: "⏱ "; }\n.session:nth-child(odd) { background: #f5f5f5; }\n.live::after { content: " LIVE"; color: #c0392b; font-weight: bold; }\n';
Object.assign(cssSolutions, {
  'web-12-responsive-cards': {
    valid: [fc(CARDS3, cdCss), fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); }\n@media (max-width: 699px) { .cards { grid-template-columns: 1fr; } }\n')],
    wrong: [fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); }\n'), fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; }\n'), fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; }\n@media (min-width: 800px) { .cards { grid-template-columns: repeat(3, 1fr); } }\n'), fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; }\n@media (min-width: 600px) { .cards { grid-template-columns: repeat(3, 1fr); } }\n'), fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; }\n@media (max-width: 700px) { .cards { grid-template-columns: repeat(3, 1fr); } }\n'), fc(CARDS3, cdBase + '.cards { display: grid; gap: 12px; width: 1000px; }\n@media (min-width: 700px) { .cards { grid-template-columns: repeat(3, 1fr); } }\n')],
  },
  'web-12-mobile-inventory': {
    valid: [fc(ITEM, itCss), fc(ITEM, itBase + '.item { display: flex; gap: 16px; }\n.pic { flex: none; }\n.info { flex: 1; }\n@media (max-width: 599px) { .item { flex-direction: column; } }\n')],
    wrong: [fc(ITEM, itBase + '.item { display: flex; gap: 16px; }\n.pic { flex: none; }\n.info { flex: 1; }\n'), fc(ITEM, itBase + '.item { display: flex; flex-direction: column; gap: 16px; }\n.pic { flex: none; }\n'), fc(ITEM, itCss.replace('min-width: 600px', 'min-width: 700px')), fc(ITEM, itCss.replace('gap: 16px', 'gap: 8px')), fc(ITEM, itCss.replace('min-width: 600px', 'max-width: 600px'))],
  },
  'web-12-portfolio-header': {
    valid: [fc(TOP, tpCss)],
    wrong: [fc(TOP, tpCss.replace('.hero { max-width: 100%; }\n', '')), fc(TOP, tpCss.replace('min-width: 640px) {\n  .top', 'min-width: 700px) {\n  .top')), fc(TOP, tpCss.replace('justify-content: space-between; ', '')), fc(TOP, tpBase + '.hero { max-width: 100%; }\n.top { display: flex; justify-content: space-between; align-items: center; }\n')],
  },
  'web-12-scoreboard-mobile': {
    valid: [fc(BOARD3, bdCss), fc(BOARD3, bdBase + '.board { display: grid; gap: 10px; grid-template-columns: repeat(4, 1fr); }\n@media (max-width: 799px) { .board { grid-template-columns: repeat(2, 1fr); } }\n@media (max-width: 499px) { .board { grid-template-columns: 1fr; } }\n')],
    wrong: [fc(BOARD3, bdCss.replace('min-width: 500px', 'min-width: 600px')), fc(BOARD3, bdCss.replace('min-width: 800px', 'min-width: 900px')), fc(BOARD3, bdCss.replace('gap: 10px', 'gap: 12px')), fc(BOARD3, bdBase + '.board { display: grid; gap: 10px; grid-template-columns: repeat(4, 1fr); }\n'), fc(BOARD3, bdCss.replace('repeat(4, 1fr)', 'repeat(3, 1fr)'))],
  },
  'web-12-pseudo-warnings': {
    valid: [fc(WARN, wnCss), fc(WARN, wnCss.replace('::before', ':before'))],
    wrong: [fc(WARN, wnCss.replace('"WARNING: "', '"WARNING:"')), fc(WARN, wnCss.replace('.warning::before', '.warning::after')), fc(WARN, wnCss.replace('.checks li:last-child::after { content: "."; }\n', '')), fc(WARN, wnCss.replace('button:disabled', 'button')), fc(WARN, wnCss.replace('color: #b00020; ', '')), fc(WARN, wnCss.replace('.warning::before', 'p::before'))],
  },
  'web-12-pseudo-schedule': {
    valid: [fc(SCHED, scCss), fc(SCHED, scCss.replace('nth-child(odd)', 'nth-child(2n+1)'))],
    wrong: [fc(SCHED, scCss.replace('nth-child(odd)', 'nth-child(even)')), fc(SCHED, scCss.replace('"⏱ "', '"⏱"')), fc(SCHED, scCss.replace('font-weight: bold; ', '')), fc(SCHED, scCss.replace('.live::after', '.session::after')), fc(SCHED, scCss.replace('.session::before { content: "⏱ "; }\n', ''))],
  },
});

const PANEL = '<div class="panel">\n  <h2>Pump 3</h2>\n  <p class="value">4.5 bar</p>\n  <p>Nominal</p>\n</div>\n';
const PCARD = '<div class="card">\n  <h3>Helmet</h3>\n  <p class="price">£19.99</p>\n  <p class="desc">Lightweight.</p>\n</div>\n';
const SBOARD = '<div class="board">\n  <h2>Owls v Bears</h2>\n  <p class="total">5 - 3</p>\n  <p>Full time</p>\n</div>\n';
const panelFix = '.panel { background: #f5f5f5; padding: 16px; border: 1px solid #cccccc; }\n.panel h2 { color: #1a3a6b; }\n.panel .value { font-size: 2rem; font-weight: bold; }\n.panel p { margin: 0; }\n';
const cardFix = '.card { background: #ffffff; padding: 20px; border: 1px solid #dddddd; }\n.card h3 { color: #7b2fbf; }\n.card .price { font-size: 1.5rem; font-weight: bold; }\n.card .desc { margin: 0; }\n';
const boardFix = '.board { background: #223; color: #fff; padding: 12px; border: 0; }\n.board h2 { color: #c0392b; }\n.board .total { font-size: 2rem; font-weight: bold; }\n.board p { margin: 0; }\n';
const MON = '<div class="page">\n  <header>Factory Monitor</header>\n  <nav>Menu</nav>\n  <main>\n    <div class="card">Press <span class="ok">OK</span></div>\n    <div class="card">Lathe <span class="down">DOWN</span></div>\n    <div class="card">Welder <span class="ok">OK</span></div>\n    <div class="card">Saw <span class="ok">OK</span></div>\n    <div class="card">Drill <span class="ok">OK</span></div>\n  </main>\n  <footer>Updated 08:00</footer>\n</div>\n';
const monBase = 'body { margin: 0; }\nheader, nav, main, footer, .card { background: #eef; padding: 12px; }\n';
const monCss = monBase + '* { box-sizing: border-box; }\n.page { display: grid; gap: 16px; }\nmain { display: grid; gap: 16px; align-content: start; }\n@media (min-width: 900px) {\n  main { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }\n  .page { grid-template-columns: 220px 1fr; }\n  header, footer { grid-column: 1 / -1; }\n}\n.ok { color: #1b7f3b; }\n.down { color: #c0392b; font-weight: bold; }\n';
const GAME = '<div class="game">\n  <div class="hud"><span class="score">Score 1200</span><span class="timer">0:42</span></div>\n  <div class="field">play area</div>\n  <div class="controls">\n    <button>Left</button><button>Jump</button><button>Right</button>\n  </div>\n</div>\n';
const gmBase = 'body { margin: 0; }\n.hud, .field, .controls { background: #223; color: #fff; }\n.controls button { height: 44px; }\n';
const gmCss = gmBase + '* { box-sizing: border-box; }\n.game { display: flex; flex-direction: column; gap: 16px; }\n.hud { display: flex; justify-content: space-between; align-items: center; }\n.field { width: 400px; max-width: 100%; aspect-ratio: 1; margin: 0 auto; }\n.controls { display: flex; gap: 8px; }\n.controls button { flex: 1; }\n@media (max-width: 479px) { .controls { flex-direction: column; } }\n';
Object.assign(cssSolutions, {
  'web-13-fix-panel-styles': { valid: [fc(PANEL, panelFix)], wrong: [fc(PANEL, panelFix.replace('padding: 16px', 'padding 16px')), fc(PANEL, panelFix.replace('color:', 'colour:')), fc(PANEL, panelFix.replace('2rem; font-weight', '2rem font-weight')), fc(PANEL, panelFix.replace('.panel p', '.panl p')), fc(PANEL, panelFix.replace('font-size: 2rem', 'font-size: 1rem')), fc(PANEL, '.panel { background: #f5f5f5; }\n')] },
  'web-13-fix-card-styles': { valid: [fc(PCARD, cardFix)], wrong: [fc(PCARD, cardFix.replace('padding: 20px;', 'padding: 20px')), fc(PCARD, cardFix.replace('font-weight', 'font-wieght')), fc(PCARD, cardFix.replace('.card .desc', '.cardd .desc')), fc(PCARD, cardFix.replace('#7b2fbf', '#7b2fbe')), fc(PCARD, cardFix.replace('1.5rem', '1.4rem'))] },
  'web-13-fix-score-styles': { valid: [fc(SBOARD, boardFix)], wrong: [fc(SBOARD, boardFix.replace('color: #c0392b', 'color #c0392b')), fc(SBOARD, boardFix.replace('.board p', '.borad p')), fc(SBOARD, boardFix.replace('font-size: 2rem', 'font-size 2rem')), fc(SBOARD, boardFix.replace('padding: 12px', 'padding: 10px')), fc(SBOARD, boardFix.replace('font-weight: bold', 'font-weight: normal'))] },
  'web-13-monitor-layout': {
    valid: [fc(MON, monCss)],
    wrong: [fc(MON, monCss.replace('220px 1fr', '200px 1fr')), fc(MON, monCss.replace('min-width: 900px', 'min-width: 1000px')), fc(MON, monCss.replace('header, footer { grid-column: 1 / -1; }', '')), fc(MON, monCss.replace('.page { display: grid; gap: 16px; }', '.page { display: grid; gap: 8px; }')), fc(MON, monCss.replace('minmax(200px, 1fr)', 'minmax(300px, 1fr)')), fc(MON, monCss.replace('.down { color: #c0392b; font-weight: bold; }', '.down { color: #c0392b; }')), fc(MON, monCss.replace('main { display: grid; gap: 16px;', 'main { display: grid; gap: 8px;'))],
  },
  'web-13-game-interface': {
    valid: [fc(GAME, gmCss)],
    wrong: [fc(GAME, gmCss.replace('max-width: 100%; ', '')), fc(GAME, gmCss.replace('aspect-ratio: 1; ', '')), fc(GAME, gmCss.replace('justify-content: space-between; ', '')), fc(GAME, gmCss.replace('@media (max-width: 479px) { .controls { flex-direction: column; } }\n', '')), fc(GAME, gmCss.replace('gap: 16px', 'gap: 12px')), fc(GAME, gmCss.replace('margin: 0 auto', 'margin: 0')), fc(GAME, gmCss.replace('.controls button { flex: 1; }\n', '')), fc(GAME, gmCss.replace('max-width: 479px', 'max-width: 600px'))],
  },
});

const CP = '<div class="panel">\n  <h1>Line 3 Control</h1>\n  <div class="gauges">\n    <div class="gauge">Temp 72°C</div>\n    <div class="gauge">Speed 1.2 m/s</div>\n    <div class="gauge critical">Pressure 9.8 bar</div>\n    <div class="gauge">Output 340/h</div>\n  </div>\n  <p class="note">Values refresh every 10 seconds.</p>\n</div>\n';
const cpCss = '* { box-sizing: border-box; }\n.panel { width: 640px; max-width: 100%; margin: 0 auto; padding: 24px; border: 2px solid #222222; }\n.gauges { display: flex; justify-content: space-between; }\n.gauge { width: 140px; height: 140px; border: 2px solid #bbbbbb; }\n.critical { color: #b00020; background: #fdecea; }\n.note { text-align: center; font-style: italic; color: #666666; margin-top: 16px; }\n@media (max-width: 559px) {\n  .gauges { display: grid; grid-template-columns: repeat(2, 140px); gap: 12px; justify-content: start; }\n}\n';
const PF = '<div class="wrap">\n  <nav class="links"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav>\n  <h1>Ada Reyes</h1>\n  <div class="projects">\n    <article class="project"><img src="a.png" alt="" width="800" height="400"><h2>Line Monitor</h2><p>A dashboard.</p></article>\n    <article class="project"><img src="b.png" alt="" width="800" height="400"><h2>Stock Tracker</h2><p>An inventory app.</p></article>\n    <article class="project"><img src="c.png" alt="" width="800" height="400"><h2>Race Timer</h2><p>Lap analysis.</p></article>\n    <article class="project"><img src="d.png" alt="" width="800" height="400"><h2>Course Planner</h2><p>A planner.</p></article>\n  </div>\n  <footer>© Ada Reyes</footer>\n</div>\n';
const pfCss = '* { box-sizing: border-box; }\nbody { margin: 0; }\n.wrap { max-width: 960px; margin: 0 auto; padding: 0 16px; }\n.links { display: flex; flex-direction: column; }\n@media (min-width: 480px) { .links { flex-direction: row; gap: 20px; } }\n.projects { display: grid; gap: 20px; }\n@media (min-width: 560px) { .projects { grid-template-columns: repeat(2, 1fr); } }\n@media (min-width: 900px) { .projects { grid-template-columns: repeat(3, 1fr); } }\n.project { padding: 16px; border: 1px solid #dddddd; }\n.project img { width: 100%; height: auto; display: block; }\nfooter { text-align: center; color: #777777; }\n';
const RB = '<table class="board">\n  <thead><tr><th>Pos</th><th>Driver</th><th class="team">Team</th><th>Gap</th></tr></thead>\n  <tbody>\n    <tr><td class="gold">1</td><td>Reyes</td><td class="team">Owls</td><td>0.0</td></tr>\n    <tr class="me"><td class="silver">2</td><td>Nair</td><td class="team">Cats</td><td>+1.4</td></tr>\n    <tr><td class="bronze">3</td><td>Khan</td><td class="team">Bears</td><td>+3.9</td></tr>\n    <tr><td>4</td><td>Silva</td><td class="team">Wolves</td><td>+8.2</td></tr>\n    <tr><td>5</td><td>Tan</td><td class="team">Hawks</td><td>+9.0</td></tr>\n  </tbody>\n</table>\n';
const rbCss = 'body { margin: 0; }\n.board { width: 100%; border-collapse: collapse; }\n.board th, .board td { padding: 8px 12px; }\n.board th { font-weight: bold; text-align: left; color: #fff; background: #111111; }\n.board td:first-child, .board td:last-child { text-align: right; }\n.board tbody tr { background: #ffffff; }\n.board tbody tr:nth-child(even) { background: #f4f4f4; }\n.board .gold { background: #ffd700; }\n.board .silver { background: #c0c0c0; }\n.board .bronze { background: #cd7f32; }\n.board .me { font-weight: bold; }\n.board .me td:first-child { border-left: 4px solid #0066cc; }\n@media (max-width: 599px) { .team { display: none; } }\n';
Object.assign(cssSolutions, {
  'web-14-control-panel': {
    valid: [fc(CP, cpCss)],
    wrong: [fc(CP, cpCss.replace('* { box-sizing: border-box; }\n', '')), fc(CP, cpCss.replace('display: flex; justify-content: space-between; }', 'display: flex; justify-content: space-around; }')), fc(CP, cpCss.replace('gap: 12px; justify-content: start', 'gap: 6px; justify-content: start')), fc(CP, cpCss.replace('max-width: 100%; ', '')), fc(CP, cpCss.replace('margin: 0 auto; ', '')), fc(CP, cpCss.replace('margin-top: 16px', 'margin-top: 8px')), fc(CP, cpCss.replace('559px', '600px')), fc(CP, cpCss.replace('.critical { color: #b00020; background: #fdecea; }\n', '.critical { color: #b00020; }\n'))],
  },
  'web-14-portfolio': {
    valid: [fc(PF, pfCss)],
    wrong: [fc(PF, pfCss.replace('.project img { width: 100%; height: auto; display: block; }\n', '')), fc(PF, pfCss.replace('.wrap { max-width: 960px; margin: 0 auto; padding: 0 16px; }', '.wrap { max-width: 960px; padding: 0 16px; }')), fc(PF, pfCss.replace('min-width: 900px', 'min-width: 1000px')), fc(PF, pfCss.replace('min-width: 560px', 'min-width: 600px')), fc(PF, pfCss.replace('gap: 20px; }\n@media', 'gap: 16px; }\n@media').replace('.projects { display: grid; gap: 20px; }', '.projects { display: grid; gap: 16px; }')), fc(PF, pfCss.replace('.links { display: flex; flex-direction: column; }\n@media (min-width: 480px) { .links { flex-direction: row; gap: 20px; } }\n', '.links { display: flex; gap: 20px; }\n')), fc(PF, pfCss.replace('padding: 0 16px;', '')), fc(PF, pfCss.replace('* { box-sizing: border-box; }\n', '')), fc(PF, pfCss.replace('color: #777777', 'color: #666666'))],
  },
  'web-14-race-board': {
    valid: [fc(RB, rbCss)],
    wrong: [fc(RB, rbCss.replace('.board .me td:first-child { border-left: 4px solid #0066cc; }\n', '')), fc(RB, rbCss.replace('@media (max-width: 599px) { .team { display: none; } }\n', '')), fc(RB, rbCss.replace('599px', '700px')), fc(RB, rbCss.replace('nth-child(even)', 'nth-child(odd)')), fc(RB, rbCss.replace('padding: 8px 12px', 'padding: 12px 8px')), fc(RB, rbCss.replace('.board td:first-child, .board td:last-child { text-align: right; }\n', '')), fc(RB, rbCss.replace('.board .gold { background: #ffd700; }\n', '')), fc(RB, rbCss.replace('.board .me { font-weight: bold; }\n', '')), fc(RB, rbCss.replace('width: 100%; ', ''))],
  },
});
