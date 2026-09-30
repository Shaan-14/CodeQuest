import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, S, wc, web } from './helpers';

const CTL = "input:not([type=submit]):not([type=button]):not([type=hidden]), select, textarea";
const LABELS = `h.$$('${CTL}').forEach((c) => h.assert(h.labelText(c).length > 1, 'Every field needs a label a screen reader can announce.'));`;
const DOC = `${S.doctype}\n${S.lang}\n${S.title}\nh.eq(h.$$('h1').length, 1, 'Exactly one main heading');`;

/**
 * INDEPENDENT MODE (HTML). The problem is stated in plain terms: no element names, no hints, blank editor. Checks
 * look at BEHAVIOUR and meaning (landmarks, accessible data, validation), so any correct markup passes.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'web-07-independent-html', title: 'Trial: The Page Factory', language: 'web', skillId: 'web.html',
    blurb: 'Three page briefs and nothing else. No hints, no starter.', prerequisites: ['web-06-html-debugging'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'An independent trial gives you a brief and nothing else. Use your notes and the Field Manual, test with Run, and inspect what the browser built. Hidden checks look for meaning (structure, accessibility, validation), not for one particular way of writing it.' },
    steps: [
      { kind: 'challenge', challengeId: 'web-07-machine-info' },
      { kind: 'challenge', challengeId: 'web-07-batting-leaders' },
      { kind: 'challenge', challengeId: 'web-07-track-day' },
    ],
  },
  challenges: [
    wc({
      id: 'web-07-machine-info', title: 'The Machine Information Page', mode: 'independent', skillIds: ['web.html', 'web.semantics', 'web.forms'], concepts: [], difficulty: 4, transfer: true, context: 'manufacturing', project: true,
      prompt: text(
        'A supplier needs a public information page for the machine **CNC Mill A1**. Someone using only a screen reader or a keyboard must be able to jump straight to the main content, and to a navigation with the entries `Overview`, `Specifications` and `Safety`.',
        'The page shows: a short introduction; the specifications (`Power` 11 kW, `Spindle speed` 8000 rpm, `Weight` 2400 kg) in a form where a screen reader can tell which value belongs to which name; the four safety rules, in the order they must be followed: `Wear eye protection`, `Check the guard is closed`, `Clamp the workpiece`, `Press the start button`; a photograph of the machine (`cnc.jpg`) that people who cannot see it can still make sense of; and a way to request a service visit by giving an email address and a description of the problem (at least 10 characters), both compulsory. Set the language and a browser-tab title.',
      ),
      starterFiles: files(''), tabs: ['html'], hints: [],
      checks: [
        web('A proper document', DOC, { visible: false }),
        web('Landmarks', "h.eq(h.$$('main').length, 1, 'One main content region'); const n = h.$$('nav'); h.assert(n.length >= 1, 'A navigation region'); const links = Array.from(n[0].querySelectorAll('a')).map((a) => h.norm(a.textContent)); h.eq(links, ['Overview', 'Specifications', 'Safety'], 'Navigation entries'); n.forEach((x) => h.assert((x.getAttribute('aria-label') || '').trim(), 'Name the navigation'));", { visible: false }),
        web('Specifications are accessible data', "const t = h.$('table'); h.assert(t, 'Show specifications as data with names and values.'); const rows = h.$$('table tr').filter((r) => r.querySelector('td')); const pairs = rows.map((r) => Array.from(r.children).map((c) => h.norm(c.textContent))); h.eq(pairs, [['Power', '11 kW'], ['Spindle speed', '8000 rpm'], ['Weight', '2400 kg']]); h.assert(h.$$('table th').length >= 2, 'Header cells connect each value to its name.'); h.assert(rows.every((r) => r.children[0].tagName === 'TH'), 'Each row is identified by a header cell.');", { visible: false }),
        web('Safety rules in order', "const l = h.$('main ol, ol'); h.assert(l, 'The order matters: use a list that shows it.'); h.eq(Array.from(l.children).map((x) => h.norm(x.textContent)), ['Wear eye protection', 'Check the guard is closed', 'Clamp the workpiece', 'Press the start button']);", { visible: false }),
        web('The photograph is described', "const i = h.$('img[src$=\"cnc.jpg\"]'); h.assert(i, 'Include the photograph.'); h.assert((i.getAttribute('alt') || '').trim().length >= 12, 'Describe the photograph for people who cannot see it.');", { visible: false }),
        web('The service form validates', `${LABELS}\nh.eq(h.$$('form').length, 1); h.assert(h.exists('form button, form input[type=submit]'), 'A submit button'); h.assert(!h.submit('form').valid, 'Empty form must not submit.'); h.type('input[type=email]', 'no'); h.type('textarea', 'Long enough problem text'); h.assert(!h.submit('form').valid, 'A bad email must not submit.'); h.type('input[type=email]', 'me@example.com'); h.assert(h.submit('form').valid, 'A good request should submit.'); h.eq(h.$('textarea').getAttribute('minlength'), '10'); h.assert(h.$('textarea').required && h.$('input[type=email]').required, 'Both fields are compulsory.');`, { visible: false }),
        web('The content is all there', "h.assert(/cnc mill a1/i.test(h.text('h1')), 'The main heading names the machine.'); h.assert(h.$$('main p').length >= 1, 'A short introduction.'); h.assert(h.$$('section h2, h2').length >= 2, 'Organise the content under headings.');", { visible: false }),
      ],
      xpReward: 200, coinReward: 30,
    }),
    wc({
      id: 'web-07-batting-leaders', title: 'The Batting Leaders Page', mode: 'independent', skillIds: ['web.html', 'web.semantics'], concepts: [], difficulty: 4, transfer: true, context: 'sports', project: true,
      prompt: text(
        'A baseball league wants a statistics page called **League Batting Leaders** that anyone can use, including with a screen reader or keyboard. It needs a way to jump to the main content and a navigation to `Teams`, `Players` and `Schedule`.',
        'Show these leaders in a form where each figure is tied to its column name and to its player: Ada Reyes, Owls, average .312, home runs 24; Bo Khan, Bears, .298, 31; Cy Nair, Cats, .287, 18. The table must say what it is. Each player’s name links to their own page: `players/ada-reyes.html`, `players/bo-khan.html`, `players/cy-nair.html`. Add a short note that the figures are updated nightly, set apart from the main content, and a page footer. Set the language and a browser-tab title.',
      ),
      starterFiles: files(''), tabs: ['html'], hints: [],
      checks: [
        web('A proper document', DOC, { visible: false }),
        web('Landmarks', "h.eq(h.$$('main').length, 1); h.assert(h.$$('header').length === 1 && h.$$('footer').length === 1, 'A page header and footer.'); const n = h.$('nav'); h.assert(n, 'Navigation'); h.eq(Array.from(n.querySelectorAll('a')).map((a) => h.norm(a.textContent)), ['Teams', 'Players', 'Schedule']); h.assert((n.getAttribute('aria-label') || '').trim(), 'Name the navigation'); h.assert(h.$('aside') && /nightly/i.test(h.text('aside')), 'The nightly-update note is set apart.');", { visible: false }),
        web('The data table', "h.eq(h.$$('table').length, 1); h.assert(h.norm(h.$('table > caption') ? h.$('table > caption').textContent : '').length > 3, 'The table needs a caption.'); const ths = h.$$('table thead th'); h.assert(ths.length >= 4 && ths.every((t) => t.getAttribute('scope') === 'col'), 'Column headers'); const rows = h.$$('table tbody tr'); h.eq(rows.length, 3); h.eq(rows.map((r) => Array.from(r.children).map((c) => h.norm(c.textContent))), [['Ada Reyes', 'Owls', '.312', '24'], ['Bo Khan', 'Bears', '.298', '31'], ['Cy Nair', 'Cats', '.287', '18']]); rows.forEach((r) => { h.eq(r.children[0].tagName, 'TH'); h.eq(r.children[0].getAttribute('scope'), 'row'); });", { visible: false }),
        web('Player links', "const rows = h.$$('table tbody tr'); ['players/ada-reyes.html', 'players/bo-khan.html', 'players/cy-nair.html'].forEach((href, i) => { const a = rows[i].querySelector('a'); h.assert(a, 'Each player name is a link.'); h.eq(a.getAttribute('href'), href); });", { visible: false }),
        web('Outline', "h.assert(h.$$('h2').length >= 1, 'Structure the main content with a heading.'); h.assert(h.text('h1') === 'League Batting Leaders', 'Main heading text.');", { visible: false }),
      ],
      xpReward: 200, coinReward: 30,
    }),
    wc({
      id: 'web-07-track-day', title: 'The Track Day Sign-up', mode: 'independent', skillIds: ['web.html', 'web.forms', 'web.semantics'], concepts: [], difficulty: 4, transfer: true, context: 'motorsport', project: true,
      prompt: text(
        'A circuit runs track days and needs a sign-up page called **Track Day Registration**, usable by keyboard and screen reader. It needs a way to jump to the main content.',
        'Show the day’s timetable in order (`08:00 Briefing`, `09:00 Practice`, `12:00 Lunch`, `13:00 Sessions`), then the sign-up: full name (compulsory), email (compulsory), the event day (exactly one of `Saturday 12 July` or `Sunday 13 July`, compulsory, presented as one group called `Event day`), vehicle type from `Car` or `Motorbike` (compulsory, nothing chosen at first), number of passengers from 0 to 3 (whole number, compulsory), and a waiver that must be accepted (`I accept the waiver`), with a `Register` button. The browser must enforce everything. Set the language and a browser-tab title.',
      ),
      starterFiles: files(''), tabs: ['html'], hints: [],
      checks: [
        web('A proper document with a main region', `${DOC}\nh.eq(h.$$('main').length, 1, 'One main content region');`, { visible: false }),
        web('The timetable is ordered', "const l = h.$('ol'); h.assert(l, 'The order matters: use a list that shows it.'); h.eq(Array.from(l.children).map((x) => h.norm(x.textContent)), ['08:00 Briefing', '09:00 Practice', '12:00 Lunch', '13:00 Sessions']);", { visible: false }),
        web('Fields are labelled and grouped', `${LABELS}\nconst r = h.$$('input[type=radio]'); h.eq(r.length, 2); h.eq(new Set(r.map((x) => x.name)).size, 1); h.eq(r.map((x) => h.labelText(x)).sort(), ['Saturday 12 July', 'Sunday 13 July']); const fs = h.$('fieldset'); h.assert(fs && fs.contains(r[0]) && fs.contains(r[1]) && h.norm(fs.querySelector('legend').textContent) === 'Event day', 'Group the two days under the label Event day.'); h.eq(h.labelText('input[type=checkbox]'), 'I accept the waiver'); const b = h.$('form button, form input[type=submit]'); h.assert(b, 'A button'); h.eq(h.norm(b.textContent || b.value), 'Register');`, { visible: false }),
        web('The browser enforces the rules', "const NAME = 'input:not([type=email]):not([type=number]):not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button])'; const go = (o) => { h.type(NAME, o.name); h.type('input[type=email]', o.email); h.type('input[type=number]', o.pax); h.select('select', o.veh); const r = h.$$('input[type=radio]'); if (o.day) h.click(r[0]); else { r.forEach((x) => { x.checked = false; }); } h.check('input[type=checkbox]', o.waiver); return h.submit('form'); }; const ok = { name: 'Ada Reyes', email: 'a@b.co', pax: '2', veh: 'Car', day: true, waiver: true }; h.assert(go(ok).valid, 'A complete valid form should submit.'); h.assert(!go({ ...ok, name: '' }).valid, 'Name is compulsory.'); h.assert(!go({ ...ok, email: 'bad' }).valid, 'Email must look like an email.'); h.assert(!go({ ...ok, pax: '4' }).valid, 'At most 3 passengers.'); h.assert(!go({ ...ok, pax: '-1' }).valid, 'Not below 0.'); h.assert(go({ ...ok, pax: '0' }).valid, '0 passengers is fine.'); h.assert(!go({ ...ok, pax: '' }).valid, 'Passengers are compulsory.'); h.assert(!go({ ...ok, veh: '' }).valid, 'Vehicle type is compulsory.'); h.assert(!go({ ...ok, waiver: false }).valid, 'The waiver must be accepted.'); h.assert(!go({ ...ok, day: false }).valid, 'An event day must be chosen.');", { visible: false }),
        web('The vehicle list', "const o = Array.from(h.$('select').options); h.eq(o.slice(1).map((x) => h.norm(x.textContent)), ['Car', 'Motorbike']); h.eq(o[0].value, '');", { visible: false }),
      ],
      xpReward: 200, coinReward: 30,
    }),
  ],
};
