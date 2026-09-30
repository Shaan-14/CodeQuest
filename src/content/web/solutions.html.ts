import type { WebFiles } from '../schema';
import type { Sol } from './solutions.testdata';

const f = (html: string, css = '', js = ''): WebFiles => ({ html, css, js });
const doc = (title: string, body: string, head = ''): string => `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${title}</title>\n${head}</head>\n<body>\n${body}\n</body>\n</html>`;

const nav = (tag: 'ul' | 'ol', items: [string, string][], attrs = '') => `<${tag}>\n` + items.map(([t, h]) => `<li><a href="${h}"${attrs}>${t}</a></li>`).join('\n') + `\n</${tag}>`;

const menu: [string, string][] = [['Home', 'index.html'], ['Machines', 'machines.html'], ['Contact', 'contact.html']];
const reads: [string, string][] = [['Databases in Practice', 'https://example.org/db'], ['Networks Explained', 'https://example.org/net'], ['Ethics for Engineers', 'https://example.org/ethics']];
const ext = ' target="_blank" rel="noopener"';
const parts: [string, string][] = [['Bolt M8', 'parts/bolt-m8.html'], ['Gear 40T', 'parts/gear-40t.html'], ['Valve 12V', 'parts/valve-12v.html']];
const roster = (alt: (n: string) => string, img = (n: string) => `players/${n}.jpg`, ul = 'ul') =>
  `<${ul}>\n` + [['Ada Reyes', 'ada'], ['Bo Khan', 'bo'], ['Cy Nair', 'cy']].map(([n, k]) => `<li><img src="${img(k!)}" alt="${alt(n!)}"> <a href="players/${k}.html">${n}</a></li>`).join('\n') + `\n</${ul}>`;

export const htmlSolutions: Record<string, Sol> = {
  'web-02-nav-list': {
    valid: [f(`<h1>Bytehaven Works</h1>\n${nav('ul', menu)}`), f(`<h1>Bytehaven Works</h1>\n<ul><li><a href='index.html'>Home</a></li><li><a href='machines.html'>Machines</a></li><li><a href='contact.html'>Contact</a></li></ul>`)],
    wrong: [
      f(`<h1>Bytehaven Works</h1>\n${nav('ol', menu)}`),
      f(`<h1>Bytehaven Works</h1>\n<p><a href="index.html">Home</a> <a href="machines.html">Machines</a> <a href="contact.html">Contact</a></p>`),
      f(`<h1>Bytehaven Works</h1>\n<ul><li>Home</li><li>Machines</li><li>Contact</li></ul>`),
      f(`<h1>Bytehaven Works</h1>\n${nav('ul', menu.slice(0, 2))}`),
      f(`<h1>Bytehaven Works</h1>\n${nav('ul', [['Home', 'Home.html'], ['Machines', 'machines.html'], ['Contact', 'contact.html']])}`),
      f(`${nav('ul', menu)}`),
    ],
  },
  'web-02-reading-list': {
    valid: [f(nav('ol', reads, ext))],
    wrong: [f(nav('ul', reads, ext)), f(nav('ol', reads)), f(nav('ol', reads, ' target="_blank"')), f(nav('ol', reads.slice(0, 2), ext)), f(nav('ol', [reads[1]!, reads[0]!, reads[2]!], ext)), f(nav('ol', reads, ' rel="noopener"'))],
  },
  'web-02-roster': {
    valid: [f(roster((n) => `Photo of ${n}, player`)), f(roster((n) => `${n} in the club shirt`))],
    wrong: [f(roster(() => '')), f(roster((n) => `Photo of ${n}`, undefined, 'ol')), f(roster((n) => n.slice(0, 2))), f(roster((_n) => 'players/ada.jpg')), f(roster((n) => `Photo of ${n}`, (k) => `img/${k}.jpg`)), f(roster((n) => `Photo of ${n}`).replace(/<a href="[^"]*">/g, '<a>'))],
  },
  'web-02-parts-catalogue': {
    valid: [f(`<h1>Parts Catalogue</h1>\n${nav('ul', parts)}\n<a href="../index.html">Back to the catalogue home</a>`)],
    wrong: [
      f(`<h1>Parts Catalogue</h1>\n${nav('ul', parts)}`),
      f(`<h1>Parts Catalogue</h1>\n<a href="../index.html">Back to the catalogue home</a>\n${nav('ul', parts)}`),
      f(`<h1>Parts Catalogue</h1>\n${nav('ul', parts).replace('</ul>', '<li><a href="../index.html">Back to the catalogue home</a></li>\n</ul>')}`),
      f(`<h1>Parts Catalogue</h1>\n${nav('ul', parts)}\n<a href="/index.html">Back to the catalogue home</a>`),
      f(`<h1>Parts</h1>\n${nav('ul', parts)}\n<a href="../index.html">Back to the catalogue home</a>`),
      f(`<h1>Parts Catalogue</h1>\n${nav('ul', parts.map(([t, h]) => [t, h.replace('parts/', '')] as [string, string]))}\n<a href="../index.html">Back to the catalogue home</a>`),
    ],
  },
};
export { doc };

const table = (caption: string, cols: string[], rows: string[][], foot?: string[], opts: { scope?: boolean; thead?: boolean; rowTh?: boolean; cap?: boolean } = {}) => {
  const { scope = true, thead = true, rowTh = true, cap = true } = opts;
  const th = (t: string, s: string) => `<th${scope ? ` scope="${s}"` : ''}>${t}</th>`;
  const head = `<tr>${cols.map((c) => th(c, 'col')).join('')}</tr>`;
  const body = rows.map((r) => `<tr>${r.map((c, i) => (i === 0 && rowTh ? th(c, 'row') : `<td>${c}</td>`)).join('')}</tr>`).join('\n');
  const tf = foot ? `\n<tfoot><tr>${foot.map((c, i) => (i === 0 ? th(c, 'row') : `<td>${c}</td>`)).join('')}</tr></tfoot>` : '';
  return `<table>\n${cap ? `<caption>${caption}</caption>\n` : ''}${thead ? `<thead>${head}</thead>\n` : head + '\n'}<tbody>\n${body}\n</tbody>${tf}\n</table>`;
};
const tableSol = (caption: string, cols: string[], rows: string[][], foot?: string[]): Sol => ({
  valid: [f(table(caption, cols, rows, foot))],
  wrong: [
    f(table(caption, cols, rows, foot, { cap: false })),
    f(table(caption, cols, rows, foot, { scope: false })),
    f(table(caption, cols, rows, foot, { thead: false })),
    f(table(caption, cols, rows, foot, { rowTh: false })),
    f(table(caption, cols, rows.slice(0, -1), foot)),
    f(table(caption + '!', cols, rows, foot)),
    ...(foot ? [f(table(caption, cols, [...rows, foot]))] : []),
  ],
});
Object.assign(htmlSolutions, {
  'web-03-downtime-table': tableSol('Downtime this week', ['Machine', 'Hours', 'Status'], [['Press 1', '4.5', 'running'], ['Lathe', '12', 'down'], ['Welder', '0', 'idle']]),
  'web-03-standings-table': tableSol('League standings', ['Team', 'Played', 'Won', 'Points'], [['Owls', '10', '8', '24'], ['Bears', '10', '6', '18'], ['Cats', '10', '3', '9']]),
  'web-03-budget-table': tableSol('Q1 budget', ['Item', 'Planned', 'Actual'], [['Salaries', '5000', '5200'], ['Equipment', '1200', '900'], ['Travel', '800', '950']], ['Total', '7000', '7050']),
  'web-03-readings-table': tableSol('Sensor readings', ['Sensor', 'Unit', 'Value', 'Taken'], [['S1', '°C', '21.5', '08:00'], ['S2', '°C', '19.0', '08:05'], ['S3', 'kPa', '101.3', '08:10'], ['S4', 'kPa', '99.8', '08:15']]),
});

const page = (h1: string, navLinks: string[], sections: string[], aside: string, over: { noMain?: boolean; twoMain?: boolean; noAria?: boolean; navOutside?: boolean; divs?: boolean; noAsideHeading?: boolean; noSectionH2?: boolean } = {}) => {
  const links = navLinks.map((l) => `<a href="#${l.toLowerCase()}">${l}</a>`).join('\n');
  const nav = `<nav${over.noAria ? '' : ' aria-label="Main"'}>\n${links}\n</nav>`;
  const secs = sections.map((s) => `<section>\n${over.noSectionH2 ? '<p>' + s + '</p>' : `<h2>${s}</h2>`}\n<p>Content.</p>\n</section>`).join('\n');
  const main = over.noMain ? `<div>\n${secs}\n</div>` : `<main>\n${secs}\n</main>${over.twoMain ? '\n<main><p>x</p></main>' : ''}`;
  if (over.divs) return doc(h1, `<div class="header"><h1>${h1}</h1>\n${nav}</div>\n${main}\n<aside><h2>${aside}</h2><p>Extra.</p></aside>\n<div class="footer">Footer text here</div>`);
  return doc(h1, `<header>\n<h1>${h1}</h1>\n${over.navOutside ? '' : nav}\n</header>\n${over.navOutside ? nav : ''}\n${main}\n<aside>\n${over.noAsideHeading ? '' : `<h2>${aside}</h2>`}\n<p>Extra.</p>\n</aside>\n<footer><p>Footer text here</p></footer>`);
};
const pageSol = (h1: string, navLinks: string[], sections: string[], aside: string): Sol => ({
  valid: [f(page(h1, navLinks, sections, aside))],
  wrong: [
    f(page(h1, navLinks, sections, aside, { noMain: true })),
    f(page(h1, navLinks, sections, aside, { twoMain: true })),
    f(page(h1, navLinks, sections, aside, { noAria: true })),
    f(page(h1, navLinks, sections, aside, { navOutside: true })),
    f(page(h1, navLinks, sections, aside, { divs: true })),
    f(page(h1, navLinks, sections, aside, { noAsideHeading: true })),
    f(page(h1, navLinks, sections, aside, { noSectionH2: true })),
    f(page(h1, navLinks.slice(1), sections, aside)),
  ],
});
const img = (src: string, alt?: string) => `<img src="${src}"${alt === undefined ? '' : ` alt="${alt}"`}>`;
const auditSol = (title: string, inf: [string, string][], dec: string): Sol => ({
  valid: [f(`<h1>${title}</h1>\n${inf.map(([s, a]) => img(s, a)).join('\n')}\n${img(dec, '')}`)],
  wrong: [
    f(`<h1>${title}</h1>\n${inf.map(([s, a]) => img(s, a)).join('\n')}\n${img(dec)}`),
    f(`<h1>${title}</h1>\n${inf.map(([s, a]) => img(s, a)).join('\n')}\n${img(dec, 'decorative divider')}`),
    f(`<h1>${title}</h1>\n${inf.map(([s]) => img(s, '')).join('\n')}\n${img(dec, '')}`),
    f(`<h1>${title}</h1>\n${inf.map(([s]) => img(s, s)).join('\n')}\n${img(dec, '')}`),
    f(`<h1>${title}</h1>\n${inf.map(([s]) => img(s)).join('\n')}\n${img(dec, '')}`),
    f(`<h1>${title}</h1>\n${inf.map(([s, a]) => img(s, a)).join('\n')}`),
  ],
});
Object.assign(htmlSolutions, {
  'web-04-landmarks': pageSol('Student Dashboard', ['Courses', 'Grades', 'Calendar'], ['Upcoming deadlines', 'Recent grades'], 'Announcements'),
  'web-04-monitoring-page': pageSol('Machine Monitor', ['Overview', 'Alerts', 'Reports'], ['Live status', 'Open alerts'], 'Maintenance schedule'),
  'web-04-stats-page': pageSol('League Stats', ['Teams', 'Players', 'Schedule'], ['Batting leaders', 'Pitching leaders'], 'News'),
  'web-04-alt-audit': auditSol('Weld Inspection', [['crack.jpg', 'Close-up photo of a crack running along the weld seam'], ['downtime.png', 'Bar chart of machine downtime hours for each week']], 'divider.png'),
  'web-04-gallery-audit': auditSol('Grand Prix Gallery', [['start.jpg', 'Photo of the cars leaving the start line'], ['podium.jpg', 'Photo of the three winners celebrating on the podium']], 'flag.svg'),
});

const lab = (id: string, text: string) => `<label for="${id}">${text}</label>`;
const contact = (o: { type?: string; textarea?: boolean; req?: boolean; label?: boolean } = {}) => {
  const { type = 'email', textarea = true, req = true, label = true } = o;
  const r = req ? ' required' : '';
  return `<h1>Contact us</h1>\n<form>\n${label ? lab('n', 'Name') : ''}<input id="n" name="name"${r}>\n${label ? lab('e', 'Email') : ''}<input id="e" name="email" type="${type}"${r}>\n${label ? lab('m', 'Message') : ''}${textarea ? `<textarea id="m" name="message"${r}></textarea>` : `<input id="m" name="message"${r}>`}\n<button>Send</button>\n</form>`;
};
const maintenance = (o: { radios?: boolean; sameName?: boolean; fieldset?: boolean; minlength?: boolean; selReq?: boolean; placeholder?: boolean; radioReq?: boolean } = {}) => {
  const { radios = true, sameName = true, fieldset = true, minlength = true, selReq = true, placeholder = true, radioReq = true } = o;
  const rd = ['Low', 'Medium', 'High'].map((p, i) => `<label><input type="radio" name="${sameName ? 'priority' : 'p' + i}" value="${p.toLowerCase()}"${radioReq && i === 0 ? ' required' : ''}> ${p}</label>`).join('\n');
  const radioBlock = radios ? (fieldset ? `<fieldset><legend>Priority</legend>\n${rd}\n</fieldset>` : rd) : '';
  return `<form>\n${lab('m', 'Machine')}<select id="m" name="machine"${selReq ? ' required' : ''}>${placeholder ? '<option value="">Choose...</option>' : ''}<option>Press</option><option>Lathe</option><option>Welder</option></select>\n${radioBlock}\n${lab('d', 'Description')}<textarea id="d" name="description"${minlength ? ' minlength="10"' : ''} required></textarea>\n<button>Submit request</button>\n</form>`;
};
const signup = (o: { pattern?: boolean; min?: boolean; agreeReq?: boolean; emailType?: boolean } = {}) => {
  const { pattern = true, min = true, agreeReq = true, emailType = true } = o;
  return `<form>\n${lab('i', 'Student ID')}<input id="i" name="id"${pattern ? ' pattern="[0-9]{6}"' : ''} required>\n${lab('e', 'Email')}<input id="e" name="email" type="${emailType ? 'email' : 'text'}" required>\n${lab('y', 'Year')}<input id="y" name="year" type="number"${min ? ' min="1" max="4"' : ''} required>\n<label><input type="checkbox" name="agree"${agreeReq ? ' required' : ''}> I accept the course rules</label>\n<button>Sign up</button>\n</form>`;
};
const entry = (o: { maxName?: boolean; carRange?: boolean; classReq?: boolean; licReq?: boolean; notesReq?: boolean; notesMax?: boolean } = {}) => {
  const { maxName = true, carRange = true, classReq = true, licReq = true, notesReq = false, notesMax = true } = o;
  return `<form>\n${lab('n', 'Driver name')}<input id="n" name="name"${maxName ? ' maxlength="30"' : ''} required>\n${lab('c', 'Car number')}<input id="c" name="car" type="number"${carRange ? ' min="1" max="99"' : ''} required>\n${lab('k', 'Class')}<select id="k" name="class"${classReq ? ' required' : ''}><option value="">Choose...</option><option>Open</option><option>Pro</option><option>Junior</option></select>\n${lab('t', 'Notes')}<textarea id="t" name="notes"${notesMax ? ' maxlength="200"' : ''}${notesReq ? ' required' : ''}></textarea>\n<label><input type="checkbox" name="licence"${licReq ? ' required' : ''}> I hold a valid licence</label>\n<button>Enter race</button>\n</form>`;
};
Object.assign(htmlSolutions, {
  'web-05-contact-form': {
    valid: [f(contact()), f(contact().replace(/<label for="n">Name<\/label><input id="n"/, '<label>Name <input id="n"').replace('name="name" required>', 'name="name" required></label>'))],
    wrong: [f(contact({ type: 'text' })), f(contact({ textarea: false })), f(contact({ req: false })), f(contact({ label: false })), f(contact().replace(' required></textarea>', '></textarea>')), f(contact().replace('<button>Send</button>', '<button>Go</button>'))],
  },
  'web-05-maintenance-request': {
    valid: [f(maintenance())],
    wrong: [f(maintenance({ radios: false })), f(maintenance({ sameName: false })), f(maintenance({ fieldset: false })), f(maintenance({ minlength: false })), f(maintenance({ selReq: false })), f(maintenance({ placeholder: false })), f(maintenance({ radioReq: false }))],
  },
  'web-05-course-signup': {
    valid: [f(signup())],
    wrong: [f(signup({ pattern: false })), f(signup({ min: false })), f(signup({ agreeReq: false })), f(signup({ emailType: false })), f(signup().replace('pattern="[0-9]{6}"', 'pattern="[0-9]+"')), f(signup().replace(' required>\n<label><input type="checkbox"', '>\n<label><input type="checkbox"').replace('name="id" pattern="[0-9]{6}" required', 'name="id" pattern="[0-9]{6}"'))],
  },
  'web-05-race-entry': {
    valid: [f(entry())],
    wrong: [f(entry({ maxName: false })), f(entry({ carRange: false })), f(entry({ classReq: false })), f(entry({ licReq: false })), f(entry({ notesReq: true })), f(entry({ notesMax: false })), f(entry().replace('min="1" max="99"', 'min="1" max="999"'))],
  },
});

Object.assign(htmlSolutions, {
  'web-06-fix-report': {
    valid: [f('<h1>Valve Inspection</h1>\n<h2>Summary</h2>\n<p>The valve is corroded.</p>\n<img src="valve.jpg" alt="Close-up photo of the corroded valve body">\n<h2>Readings</h2>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<tr><td>A</td><td>4.5</td></tr>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal</li><li>Repaint</li></ul>\n')],
    wrong: [
      f('<h1>Valve Inspection\n<h2>Summary</h2>\n<p>The valve is corroded.</p>\n<img src="valve.jpg" alt="Close-up photo of the corroded valve body">\n<h2>Readings</h2>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<tr><td>A</td><td>4.5</td></tr>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal</li><li>Repaint</li></ul>\n'),
      f('<h1>Valve Inspection</h1>\n<h3>Summary</h3>\n<p>The valve is corroded.</p>\n<img src="valve.jpg" alt="Close-up photo of the corroded valve body">\n<h3>Readings</h3>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<tr><td>A</td><td>4.5</td></tr>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal</li><li>Repaint</li></ul>\n'),
      f('<h1>Valve Inspection</h1>\n<h2>Summary</h2>\n<p>The valve is corroded.</p>\n<img src="valve.jpg">\n<h2>Readings</h2>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<tr><td>A</td><td>4.5</td></tr>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal</li><li>Repaint</li></ul>\n'),
      f('<h1>Valve Inspection</h1>\n<h2>Summary</h2>\n<p>The valve is corroded.</p>\n<img src="valve.jpg" alt="Close-up photo of the corroded valve body">\n<h2>Readings</h2>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<td>A</td><td>4.5</td>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal</li><li>Repaint</li></ul>\n'),
      f('<h1>Valve Inspection</h1>\n<h2>Summary</h2>\n<p>The valve is corroded.</p>\n<img src="valve.jpg" alt="Close-up photo of the corroded valve body">\n<h2>Readings</h2>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<tr><td>A</td><td>4.5</td></tr>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal<li>Repaint</ul>\n'),
      f('<h1>Valve Inspection</h1>\n<h2>Summary</h2>\n<p>The valve is corroded.</p>\n<img src="valve.jpg" alt="Close-up photo of the corroded valve body">\n<h2>Readings</h2>\n<table>\n<tr><th>Point</th><th>Value</th></tr>\n<tr><td>A</td><td>4.5</td></tr>\n</table>\n<ul><li>Replace seal</li><li>Repaint</li></ul>\n'),
    ],
  },
  'web-06-fix-shop-page': {
    valid: [f('<h1>Safety Helmet</h1>\n<h2>Details</h2>\n<p>Lightweight and tough.</p>\n<img src="helmet.jpg" alt="Red safety helmet seen from the side">\n<h2>Prices</h2>\n<table>\n<tr><th>Size</th><th>Price</th></tr>\n<tr><td>M</td><td>19.99</td></tr>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket</li><li>Checkout</li></ol>\n')],
    wrong: [
      f('<h1>Safety Helmet</h1>\n<h2>Details</h2>\n<p>Lightweight and tough.\n<img src="helmet.jpg" alt="Red safety helmet seen from the side">\n<h2>Prices</h2>\n<table>\n<tr><th>Size</th><th>Price</th></tr>\n<tr><td>M</td><td>19.99</td></tr>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket</li><li>Checkout</li></ol>\n'),
      f('<h1>Safety Helmet</h1>\n<h3>Details</h3>\n<p>Lightweight and tough.</p>\n<img src="helmet.jpg" alt="Red safety helmet seen from the side">\n<h3>Prices</h3>\n<table>\n<tr><th>Size</th><th>Price</th></tr>\n<tr><td>M</td><td>19.99</td></tr>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket</li><li>Checkout</li></ol>\n'),
      f('<h1>Safety Helmet</h1>\n<h2>Details</h2>\n<p>Lightweight and tough.</p>\n<img src="helmet.jpg" alt="helmet">\n<h2>Prices</h2>\n<table>\n<tr><th>Size</th><th>Price</th></tr>\n<tr><td>M</td><td>19.99</td></tr>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket</li><li>Checkout</li></ol>\n'),
      f('<h1>Safety Helmet</h1>\n<h2>Details</h2>\n<p>Lightweight and tough.</p>\n<img src="helmet.jpg" alt="Red safety helmet seen from the side">\n<h2>Prices</h2>\n<table>\n<tr><th>Size</th><th>Price</th></tr>\n<td>M</td><td>19.99</td>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket</li><li>Checkout</li></ol>\n'),
      f('<h1>Safety Helmet</h1>\n<h2>Details</h2>\n<p>Lightweight and tough.</p>\n<img src="helmet.jpg" alt="Red safety helmet seen from the side">\n<h2>Prices</h2>\n<table>\n<tr><th>Size</th><th>Price</th></tr>\n<tr><td>M</td><td>19.99</td></tr>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket<li>Checkout</ol>\n'),
    ],
  },
});

const machineInfo = (o: { main?: boolean; nav?: boolean; aria?: boolean; th?: boolean; ol?: boolean; alt?: boolean; formOk?: boolean; lang?: boolean; order?: boolean } = {}) => {
  const { main = true, nav = true, aria = true, th = true, ol = true, alt = true, formOk = true, lang = true, order = true } = o;
  const rules = order ? ['Wear eye protection', 'Check the guard is closed', 'Clamp the workpiece', 'Press the start button'] : ['Check the guard is closed', 'Wear eye protection', 'Clamp the workpiece', 'Press the start button'];
  const specs = [['Power', '11 kW'], ['Spindle speed', '8000 rpm'], ['Weight', '2400 kg']];
  const tbl = `<table>\n<caption>Specifications</caption>\n<thead><tr><th scope="col">Name</th><th scope="col">Value</th></tr></thead>\n<tbody>\n${specs.map(([a, b]) => `<tr>${th ? `<th scope="row">${a}</th>` : `<td>${a}</td>`}<td>${b}</td></tr>`).join('\n')}\n</tbody></table>`;
  const body = `<header><h1>CNC Mill A1</h1>\n${nav ? `<nav${aria ? ' aria-label="Page sections"' : ''}><a href="#overview">Overview</a> <a href="#specs">Specifications</a> <a href="#safety">Safety</a></nav>` : ''}</header>\n${main ? '<main>' : '<div>'}\n<section id="overview"><h2>Overview</h2><p>A three-axis milling machine for small parts.</p><img src="cnc.jpg" ${alt ? 'alt="The CNC mill with its front guard open and a workpiece clamped"' : ''}></section>\n<section id="specs"><h2>Specifications</h2>\n${tbl}</section>\n<section id="safety"><h2>Safety</h2>\n<${ol ? 'ol' : 'ul'}>${rules.map((r) => `<li>${r}</li>`).join('')}</${ol ? 'ol' : 'ul'}></section>\n<section><h2>Request a service visit</h2>\n<form>\n<label for="e">Email</label><input id="e" type="email" name="email"${formOk ? ' required' : ''}>\n<label for="p">Problem</label><textarea id="p" name="problem" minlength="10"${formOk ? ' required' : ''}></textarea>\n<button>Request visit</button></form></section>\n${main ? '</main>' : '</div>'}`;
  return `<!DOCTYPE html>\n<html${lang ? ' lang="en"' : ''}><head><meta charset="utf-8"><title>CNC Mill A1</title></head><body>\n${body}\n</body></html>`;
};
const leaders = (o: { caption?: boolean; scope?: boolean; links?: boolean; aside?: boolean; footer?: boolean; rowTh?: boolean } = {}) => {
  const { caption = true, scope = true, links = true, aside = true, footer = true, rowTh = true } = o;
  const rows = [['Ada Reyes', 'Owls', '.312', '24', 'ada-reyes'], ['Bo Khan', 'Bears', '.298', '31', 'bo-khan'], ['Cy Nair', 'Cats', '.287', '18', 'cy-nair']];
  const cell = (r: string[]) => (rowTh ? `<th${scope ? ' scope="row"' : ''}>${links ? `<a href="players/${r[4]}.html">${r[0]}</a>` : r[0]}</th>` : `<td>${links ? `<a href="players/${r[4]}.html">${r[0]}</a>` : r[0]}</td>`);
  return `<!DOCTYPE html>\n<html lang="en"><head><title>League Batting Leaders</title></head><body>\n<header><h1>League Batting Leaders</h1><nav aria-label="Site"><a href="teams.html">Teams</a> <a href="players.html">Players</a> <a href="schedule.html">Schedule</a></nav></header>\n<main><h2>This season</h2>\n<table>${caption ? '<caption>Batting leaders</caption>' : ''}<thead><tr>${['Player', 'Team', 'Average', 'Home runs'].map((c) => `<th${scope ? ' scope="col"' : ''}>${c}</th>`).join('')}</tr></thead><tbody>\n${rows.map((r) => `<tr>${cell(r)}<td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('\n')}\n</tbody></table></main>\n${aside ? '<aside><p>Figures are updated nightly.</p></aside>' : ''}\n${footer ? '<footer><p>League office</p></footer>' : ''}\n</body></html>`;
};
const trackDay = (o: { fieldset?: boolean; ol?: boolean; ranges?: boolean; waiver?: boolean; veh?: boolean; main?: boolean; nameReq?: boolean; radioReq?: boolean; placeholder?: boolean } = {}) => {
  const { fieldset = true, ol = true, ranges = true, waiver = true, veh = true, main = true, nameReq = true, radioReq = true, placeholder = true } = o;
  const days = ['Saturday 12 July', 'Sunday 13 July'].map((d, i) => `<label><input type="radio" name="day" value="${i}"${radioReq && i === 0 ? ' required' : ''}> ${d}</label>`).join('\n');
  return `<!DOCTYPE html>\n<html lang="en"><head><title>Track Day Registration</title></head><body>\n<h1>Track Day Registration</h1>\n${main ? '<main>' : '<div>'}\n<h2>Timetable</h2>\n<${ol ? 'ol' : 'ul'}><li>08:00 Briefing</li><li>09:00 Practice</li><li>12:00 Lunch</li><li>13:00 Sessions</li></${ol ? 'ol' : 'ul'}>\n<h2>Sign up</h2>\n<form>\n<label for="n">Full name</label><input id="n" name="name"${nameReq ? ' required' : ''}>\n<label for="e">Email</label><input id="e" type="email" name="email" required>\n${fieldset ? `<fieldset><legend>Event day</legend>\n${days}\n</fieldset>` : days}\n<label for="v">Vehicle type</label><select id="v" name="vehicle" required>${placeholder ? '<option value="">Choose...</option>' : ''}<option>Car</option>${veh ? '<option>Motorbike</option>' : ''}</select>\n<label for="p">Passengers</label><input id="p" type="number" name="pax"${ranges ? ' min="0" max="3"' : ''} required>\n<label><input type="checkbox" name="waiver"${waiver ? ' required' : ''}> I accept the waiver</label>\n<button>Register</button>\n</form>\n${main ? '</main>' : '</div>'}\n</body></html>`;
};
Object.assign(htmlSolutions, {
  'web-07-machine-info': { valid: [f(machineInfo())], wrong: [f(machineInfo({ main: false })), f(machineInfo({ nav: false })), f(machineInfo({ aria: false })), f(machineInfo({ th: false })), f(machineInfo({ ol: false })), f(machineInfo({ alt: false })), f(machineInfo({ formOk: false })), f(machineInfo({ lang: false })), f(machineInfo({ order: false }))] },
  'web-07-batting-leaders': { valid: [f(leaders())], wrong: [f(leaders({ caption: false })), f(leaders({ scope: false })), f(leaders({ links: false })), f(leaders({ aside: false })), f(leaders({ footer: false })), f(leaders({ rowTh: false }))] },
  'web-07-track-day': { valid: [f(trackDay())], wrong: [f(trackDay({ fieldset: false })), f(trackDay({ ol: false })), f(trackDay({ ranges: false })), f(trackDay({ waiver: false })), f(trackDay({ veh: false })), f(trackDay({ main: false })), f(trackDay({ nameReq: false })), f(trackDay({ radioReq: false })), f(trackDay({ placeholder: false }))] },
});
