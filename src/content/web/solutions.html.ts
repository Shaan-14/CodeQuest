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
