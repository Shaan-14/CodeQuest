import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, S, wc, web, webDemo } from './helpers';

/** A page built from landmark elements: header (with nav), main (with headed sections), aside, footer. */
const landmarks = (h1: string, navLinks: string[], sections: string[], aside: string) => [
  web('One header, one main, one footer', `${S.doctype}\nh.eq(h.$$('header').length, 1, 'One page header'); h.eq(h.$$('main').length, 1, 'Exactly one main'); h.eq(h.$$('footer').length, 1, 'One page footer'); h.assert(!h.$('main').contains(h.$('header')) && !h.$('main').contains(h.$('footer')), 'The header and footer belong outside main.');`, { feedback: 'Landmarks let keyboard and screen-reader users jump straight to the part of the page they want.' }),
  web('The header holds the page title and the navigation', `h.eq(h.text('header h1'), ${JSON.stringify(h1)}, 'The h1 is in the header'); h.eq(h.$$('h1').length, 1); const nav = h.$('header nav'); h.assert(nav, 'Put a nav element inside the header.'); h.eq(Array.from(nav.querySelectorAll('a')).map((a) => h.norm(a.textContent)), ${JSON.stringify(navLinks)}, 'Navigation links');`),
  web('The navigation is labelled', `h.$$('nav').forEach((n) => h.assert((n.getAttribute('aria-label') || '').trim().length > 2, 'Give each nav an accessible name with aria-label (a page can have several).'));`, { visible: false, feedback: 'What would a screen reader announce for an unlabelled navigation region?' }),
  web('The main content is divided into headed sections', `const secs = h.$$('main > section'); h.eq(secs.map((s) => h.norm(s.querySelector('h2') ? s.querySelector('h2').textContent : '')), ${JSON.stringify(sections)}, 'Sections of main (each a section with an h2)');`),
  web('A complementary aside and page footer', `const a = h.$('aside'); h.assert(a, 'Add an aside for supporting information.'); h.assert(a.querySelector('h2, h3'), 'The aside needs a heading.'); h.eq(h.norm(a.querySelector('h2, h3').textContent), ${JSON.stringify(aside)}, 'Aside heading'); h.assert(h.norm(h.$('footer').textContent).length > 5, 'The footer needs some text.');`, { visible: false }),
  web('Structure comes from elements, not div soup', `h.assert(!h.exists('div[class*="header"], div[class*="nav"], div[class*="footer"], div[id*="header"], div[id*="nav"], div[id*="footer"]'), 'Replace generic div elements with the element that says what the region IS.');`, { visible: false }),
];

const altAudit = (informative: [string, number][], decorative: string[]) => [
  web('Every image has an alt attribute', "h.$$('img').forEach((i) => h.assert(i.hasAttribute('alt'), 'Every image needs an alt attribute, even a decorative one (which gets an empty alt).'));"),
  web('Informative images are described', `${JSON.stringify(informative)}.forEach(([file, min]) => { const i = h.$('img[src$="' + file + '"]'); h.assert(i, 'Keep the image ' + file); const alt = (i.getAttribute('alt') || '').trim(); h.assert(alt.length >= min && alt.toLowerCase() !== file && !/\\.(jpg|png|svg)$/i.test(alt), 'Describe what ' + file + ' shows, for someone who cannot see it.'); });`),
  web('Decorative images are hidden from assistive technology', `${JSON.stringify(decorative)}.forEach((file) => { const i = h.$('img[src$="' + file + '"]'); h.assert(i, 'Keep the image ' + file); h.eq(i.getAttribute('alt'), '', file + ' is decoration: give it an empty alt so screen readers skip it'); });`),
  web('The images are all still there', `h.eq(h.$$('img').length, ${informative.length + decorative.length}, 'Number of images');`, { visible: false }),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-04-semantics', title: 'Semantic HTML and Accessibility', language: 'web', skillId: 'web.semantics',
    blurb: 'Landmarks, headings as an outline, and alt text: markup that means something to everyone.', prerequisites: ['web-03-tables'], xpReward: 55,
    reference: {
      title: 'Semantic HTML & accessibility basics',
      body: text(
        '**Semantic** elements say what a piece of the page IS: `<header>` (page or section intro), `<nav>` (major navigation), `<main>` (the one main content), `<section>` (a themed group, with a heading), `<article>` (self-contained content), `<aside>` (related extras), `<footer>`. Use `<div>` only when nothing else fits.',
        'Why: screen-reader users jump between **landmarks** and headings; search engines read the structure; and keyboard users get sensible tab order. Basics: one `<h1>`, headings in order without skipping levels, `aria-label` to name repeated landmarks (two `<nav>`s), and `alt` on every image (`alt=""` when purely decorative).',
      ),
      example: '<header><h1>Plant Dashboard</h1>\n  <nav aria-label="Main"><a href="/">Home</a></nav></header>\n<main>\n  <section><h2>Alerts</h2><p>No alerts.</p></section>\n</main>\n<footer><p>© Bytehaven</p></footer>',
    },
    steps: [
      { kind: 'teach', title: 'Meaning, not just appearance', body: text('Two pages can look identical and still be very different: one is a pile of `<div>`s, the other says *this is the navigation, this is the main content*. People using screen readers, voice control, or just a keyboard depend on that difference, and so do search engines and other programs that read your page.', 'This is what “semantic” means: choose the element for what the content **is**. It costs nothing, and it is the foundation of accessibility.') },
      webDemo({
        title: 'Same look, different meaning',
        body: text('Run both pages. They look almost the same. Now imagine using only a keyboard or a screen reader: the second one gives you landmarks to jump between, the first gives you nothing.'),
        files: files('<div class="header"><div class="title">Plant Dashboard</div></div>\n<div class="content"><div class="box">No alerts.</div></div>\n<hr>\n<header><h1>Plant Dashboard</h1></header>\n<main><section><h2>Alerts</h2><p>No alerts.</p></section></main>\n'),
        notice: 'The top half tells a machine nothing; the bottom half has a header, a main region and a titled section. Semantic elements also come with built-in behaviour (landmark navigation) for free.',
      }),
      { kind: 'challenge', challengeId: 'web-04-landmarks' },
      { kind: 'challenge', challengeId: 'web-04-alt-audit' },
    ],
  },
  objectives: [
    { id: 'web-obj-semantic-layout', title: 'Structure a page with landmark elements', summary: 'header/nav/main/section/aside/footer with a proper heading outline.' },
    { id: 'web-obj-alt-text', title: 'Write correct alternative text', summary: 'Describe informative images; give decorative ones an empty alt.' },
  ],
  challenges: [
    wc({
      id: 'web-04-landmarks', objectiveId: 'web-obj-semantic-layout', title: 'Student Dashboard Structure', mode: 'challenge', skillIds: ['web.semantics', 'web.html'], concepts: ['landmarks', 'header/nav/main/footer', 'heading outline', 'aria-label'], difficulty: 3, context: 'education',
      prompt: text('A university needs the structure of a student dashboard (no styling). Title the document, then: a page header with the main heading `Student Dashboard` and a navigation with links `Courses`, `Grades`, `Calendar`; the main content with two sections headed `Upcoming deadlines` and `Recent grades`; a side area of related content headed `Announcements`; and a footer with a line of text. Everything must use the element that says what it is, and the navigation must have an accessible name.'),
      expectedBehavior: 'A semantic page: header (h1 + labelled nav), main with two headed sections, an aside with a heading, and a footer.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Divide the page into its regions before writing anything.', 'Each region has an element whose name says what it is; a page has only one main.', 'A page can have several navigations, so how would a user tell them apart?'],
      checks: landmarks('Student Dashboard', ['Courses', 'Grades', 'Calendar'], ['Upcoming deadlines', 'Recent grades'], 'Announcements'),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-04-monitoring-page', objectiveId: 'web-obj-semantic-layout', title: 'Machine Monitoring Page', mode: 'challenge', skillIds: ['web.semantics', 'web.html'], concepts: ['landmarks', 'header/nav/main/footer', 'heading outline', 'aria-label'], difficulty: 3, context: 'manufacturing',
      prompt: text('A factory needs the structure of a machine-monitoring page (no styling). Title the document, then: a page header with the main heading `Machine Monitor` and a navigation with links `Overview`, `Alerts`, `Reports`; the main content with two sections headed `Live status` and `Open alerts`; a side area headed `Maintenance schedule`; and a footer with a line of text. Use the element that says what each region is, and give the navigation an accessible name.'),
      expectedBehavior: 'A semantic page: header (h1 + labelled nav), main with two headed sections, an aside with a heading, and a footer.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Map the description to page regions first.', 'One element per kind of region; only one main.', 'Give the navigation a name a screen reader can announce.'],
      checks: landmarks('Machine Monitor', ['Overview', 'Alerts', 'Reports'], ['Live status', 'Open alerts'], 'Maintenance schedule'),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-04-stats-page', objectiveId: 'web-obj-semantic-layout', title: 'League Stats Page', mode: 'challenge', skillIds: ['web.semantics', 'web.html'], concepts: ['landmarks', 'header/nav/main/footer', 'heading outline', 'aria-label'], difficulty: 3, context: 'sports',
      prompt: text('A baseball league needs the structure of its statistics page (no styling). Title the document, then: a page header with the main heading `League Stats` and a navigation with links `Teams`, `Players`, `Schedule`; the main content with two sections headed `Batting leaders` and `Pitching leaders`; a side area headed `News`; and a footer with a line of text. Use the element that says what each region is, and give the navigation an accessible name.'),
      expectedBehavior: 'A semantic page: header (h1 + labelled nav), main with two headed sections, an aside with a heading, and a footer.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Regions first, then elements.', 'Landmarks are unique per role (one main), but a role like navigation can repeat.', 'Repeated landmarks need distinguishing names.'],
      checks: landmarks('League Stats', ['Teams', 'Players', 'Schedule'], ['Batting leaders', 'Pitching leaders'], 'News'),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-04-alt-audit', objectiveId: 'web-obj-alt-text', title: 'The Alt-Text Audit', mode: 'challenge', skillIds: ['web.semantics'], concepts: ['alt text', 'decorative images', 'accessibility'], difficulty: 3, context: 'engineering',
      prompt: text('This inspection page has three images. `crack.jpg` is a photo of a crack in a weld and `downtime.png` is a chart of downtime by week: both carry information. `divider.png` is only a decorative line. Fix the markup so the page is accessible to someone who cannot see the images. Do not remove any image.'),
      expectedBehavior: 'Informative images have descriptive alt text; the decorative image has an empty alt.',
      starterFiles: files('<h1>Weld Inspection</h1>\n<img src="crack.jpg">\n<img src="divider.png" alt="divider">\n<img src="downtime.png" alt="chart.png">\n'), tabs: ['html'],
      hints: ['Ask of each image: does someone lose information if it is missing?', 'Meaningful images need a description; decoration should be skipped entirely by screen readers.', 'Decoration gets `alt=""` (present but empty); informative images get a full description, not a file name.'],
      checks: altAudit([['crack.jpg', 12], ['downtime.png', 12]], ['divider.png']),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-04-gallery-audit', objectiveId: 'web-obj-alt-text', title: 'The Race Gallery Audit', mode: 'challenge', skillIds: ['web.semantics'], concepts: ['alt text', 'decorative images', 'accessibility'], difficulty: 3, context: 'motorsport',
      prompt: text('A race gallery page has three images. `start.jpg` is a photo of cars leaving the start line and `podium.jpg` is a photo of the three winners on the podium: both carry information. `flag.svg` is only a decorative chequered-flag border. Fix the markup so the page is accessible to someone who cannot see the images. Do not remove any image.'),
      expectedBehavior: 'Informative images have descriptive alt text; the decorative image has an empty alt.',
      starterFiles: files('<h1>Grand Prix Gallery</h1>\n<img src="start.jpg" alt="photo">\n<img src="podium.jpg">\n<img src="flag.svg" alt="chequered flag border">\n'), tabs: ['html'],
      hints: ['Some images carry information, some are decoration.', 'A screen reader should hear the informative ones described, and skip the decoration.', 'Decoration: empty alt. Informative: a proper description, not "photo".'],
      checks: altAudit([['start.jpg', 12], ['podium.jpg', 12]], ['flag.svg']),
      xpReward: 70, coinReward: 10,
    }),
  ],
};
