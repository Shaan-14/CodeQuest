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
