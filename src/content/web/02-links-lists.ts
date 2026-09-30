import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/** Checks for "a list whose items are links": tag, ordered-ness, item count, link text and href. */
const linkList = (tag: 'ul' | 'ol', items: [string, string][], extra = '') => [
  web('The right kind of list', `h.eq(h.$$('${tag}').length, 1, 'Use exactly one ${tag} list'); h.assert(!h.exists('${tag === 'ul' ? 'ol' : 'ul'}'), 'This list should be ${tag === 'ul' ? 'unordered (bulleted)' : 'ordered (numbered)'}.');`, { feedback: tag === 'ol' ? 'Use an ordered list when the order matters.' : 'Use an unordered list when the order does not matter.' }),
  web('One list item per link', `h.eq(h.$$('${tag} > li').length, ${items.length}, 'List items directly inside the list');`),
  web('Each item is a link with the right text and destination', `const li = h.$$('${tag} > li'); ${JSON.stringify(items)}.forEach(([label, href], i) => { const a = li[i].querySelector('a'); h.assert(a, 'Item ' + (i + 1) + ' needs a link.'); h.eq(h.norm(a.textContent), label, 'Link text ' + (i + 1)); h.eq(a.getAttribute('href'), href, 'Destination of "' + label + '"'); });`),
  ...(extra ? [web('The extra requirements', extra, { visible: false })] : []),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-02-links-lists', title: 'Links, Lists and Images', language: 'web', skillId: 'web.html',
    blurb: 'Attributes, links, ordered and unordered lists, and images with alt text.', prerequisites: ['web-01-html-basics'], xpReward: 45,
    reference: {
      title: 'Links, lists and images',
      body: text(
        '`<a href="page.html">text</a>` makes a **link**; the `href` attribute is the destination (relative like `parts/bolt.html`, or absolute like `https://example.org/`). Use `target="_blank" rel="noopener"` to open another site in a new tab safely.',
        'Lists: `<ul>` (unordered, bulleted) and `<ol>` (ordered, numbered) contain `<li>` items. Use `<ol>` only when the ORDER matters. `<img src="photo.jpg" alt="Description">`: the `alt` text is what screen readers say and what shows if the image fails; it is required for meaningful images (`alt=""` for purely decorative ones).',
      ),
      example: '<ul>\n  <li><a href="index.html">Home</a></li>\n  <li><a href="https://example.org/" target="_blank" rel="noopener">Partner</a></li>\n</ul>\n<img src="press.jpg" alt="Hydraulic press with its guard raised">',
    },
    steps: [
      { kind: 'teach', title: 'Attributes and links', body: text('So far every element was just a tag. **Attributes** give a start tag extra facts, written as `name="value"`. The most important is `href` on a link: it says *where the link goes*. The text between the tags is what the reader clicks.', 'Links are what made the web a *web*. Get comfortable with two kinds of address: a **relative** path (`machines.html`, `parts/bolt.html`, `../index.html`) that is looked up from the current page, and an **absolute** address (`https://example.org/`).') },
      webDemo({
        title: 'A list of links (and an image)',
        body: text('Run it, then add a fourth link. In the sandbox the links go nowhere, but you can hover to see the address. The image cannot load (pages here have no network), so you see its `alt` text: exactly what a screen reader would say.'),
        files: files('<h1>Bytehaven Works</h1>\n<img src="press.jpg" alt="Hydraulic press with its guard raised">\n<ul>\n  <li><a href="index.html">Home</a></li>\n  <li><a href="machines.html">Machines</a></li>\n</ul>\n'),
        notice: 'A list is a `ul` containing `li` items, and the link lives INSIDE the item. `alt` is not decoration: without it, someone using a screen reader hears nothing about the image.',
      }),
      { kind: 'challenge', challengeId: 'web-02-nav-list' },
      { kind: 'challenge', challengeId: 'web-02-reading-list' },
    ],
  },
  objectives: [{ id: 'web-obj-links-lists', title: 'Build a list of links or images with correct attributes', summary: 'Choose ul or ol, and set href, target/rel, src and alt correctly.' }],
  challenges: [
    wc({
      id: 'web-02-nav-list', title: 'The Site Menu', mode: 'learning', skillIds: ['web.html'], concepts: ['lists', 'links', 'attributes'], difficulty: 2, context: 'business',
      prompt: text('Below the heading, add a navigation menu as an **unordered list** of three links: `Home` to `index.html`, `Machines` to `machines.html` and `Contact` to `contact.html`. Keep the heading.'),
      expectedBehavior: 'A bulleted list with three items, each containing a working relative link.',
      guidedSteps: ['A `<ul>` holds `<li>` items.', 'Each `<li>` contains an `<a href="...">`.', 'The link text goes between `<a>` and `</a>`.'],
      starterFiles: files('<h1>Bytehaven Works</h1>\n<!-- add the menu here -->\n'), tabs: ['html'],
      hints: ['A menu is a list of links.', 'Each list item wraps one link, and the destination is an attribute.', 'The list is `ul`; the address goes in `href`.'],
      checks: [...linkList('ul', [['Home', 'index.html'], ['Machines', 'machines.html'], ['Contact', 'contact.html']]), web('The heading is still there', "h.eq(h.text('h1'), 'Bytehaven Works');", { visible: false })],
      xpReward: 45, coinReward: 6,
    }),
    wc({
      id: 'web-02-reading-list', objectiveId: 'web-obj-links-lists', title: 'The Reading List', mode: 'challenge', skillIds: ['web.html'], concepts: ['lists', 'links', 'attributes'], difficulty: 2, context: 'education',
      prompt: text('A course needs its reading list, in the order students should read: 1. `Databases in Practice` (`https://example.org/db`), 2. `Networks Explained` (`https://example.org/net`), 3. `Ethics for Engineers` (`https://example.org/ethics`). Show it as a list where the order is clear. Each title is a link to its address, and because these are other websites, each link must open in a new tab **safely** (so the new page cannot control this one).'),
      expectedBehavior: 'A numbered list of three external links that open in a new tab with protection.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Does the order matter here? That decides the kind of list.', 'Opening in a new tab is an attribute of the link; safety is a second attribute.', '`target` and `rel` on each `<a>`; look up what `noopener` protects against.'],
      checks: linkList('ol', [['Databases in Practice', 'https://example.org/db'], ['Networks Explained', 'https://example.org/net'], ['Ethics for Engineers', 'https://example.org/ethics']], "h.$$('ol a').forEach((a) => { h.eq(a.getAttribute('target'), '_blank', 'External links open in a new tab'); h.assert((a.getAttribute('rel') || '').split(/\\s+/).includes('noopener'), 'Add rel=\"noopener\" to links with target=\"_blank\".'); });"),
      xpReward: 65, coinReward: 9,
    }),
    wc({
      id: 'web-02-roster', objectiveId: 'web-obj-links-lists', title: 'Team Roster', mode: 'challenge', skillIds: ['web.html'], concepts: ['lists', 'links', 'attributes'], difficulty: 2, context: 'sports',
      prompt: text('A club wants a roster page. Show its three players as a bulleted list. Each item has the player’s photo and name: `Ada Reyes` (`players/ada.jpg`), `Bo Khan` (`players/bo.jpg`), `Cy Nair` (`players/cy.jpg`). The name is a link to `players/ada.html`, `players/bo.html`, `players/cy.html`. Each photo needs alternative text that says what the picture is (for example who is shown), because some visitors cannot see it.'),
      expectedBehavior: 'An unordered list of three items, each with an image (with meaningful alt text) and a link containing the name.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Each item contains two things: a picture and a link.', 'The alternative text lives in an attribute of the image, and should describe the picture, not repeat the file name.', '`<img src="..." alt="...">` inside each `<li>`, next to the `<a>`.'],
      checks: [
        web('A bulleted list of three players', "h.eq(h.$$('ul').length, 1); h.assert(!h.exists('ol'), 'The order does not matter here.'); h.eq(h.$$('ul > li').length, 3);"),
        web('Names link to the right pages', "const want = [['Ada Reyes', 'players/ada.html'], ['Bo Khan', 'players/bo.html'], ['Cy Nair', 'players/cy.html']]; const li = h.$$('ul > li'); want.forEach(([n, href], i) => { const a = li[i].querySelector('a'); h.assert(a, 'Item ' + (i + 1) + ' needs a link.'); h.eq(h.norm(a.textContent), n); h.eq(a.getAttribute('href'), href); });"),
        web('Each photo has the right file and meaningful alt text', "const files = ['players/ada.jpg', 'players/bo.jpg', 'players/cy.jpg']; const li = h.$$('ul > li'); files.forEach((src, i) => { const img = li[i].querySelector('img'); h.assert(img, 'Item ' + (i + 1) + ' needs a photo.'); h.eq(img.getAttribute('src'), src); const alt = (img.getAttribute('alt') || '').trim(); h.assert(alt.length >= 6 && alt !== src && !/\\.(jpg|png)$/i.test(alt), 'Write alt text that describes the photo for someone who cannot see it.'); });", { visible: false }),
      ],
      xpReward: 65, coinReward: 9,
    }),
    wc({
      id: 'web-02-parts-catalogue', objectiveId: 'web-obj-links-lists', title: 'Parts Catalogue', mode: 'challenge', skillIds: ['web.html'], concepts: ['lists', 'links', 'attributes'], difficulty: 2, context: 'manufacturing',
      prompt: text('The stores team wants a parts catalogue page. Show the three parts as a bulleted list where each part name is a link: `Bolt M8` to `parts/bolt-m8.html`, `Gear 40T` to `parts/gear-40t.html`, `Valve 12V` to `parts/valve-12v.html`. After the list, add one more link labelled `Back to the catalogue home` to `../index.html`. Below the page heading `Parts Catalogue`.'),
      expectedBehavior: 'A heading, a bulleted list of three links, and a link back to the parent folder after the list.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['One list for the parts; the extra link is not part of it.', 'Relative addresses can climb to the parent folder.', 'The address `../index.html` means "one folder up".'],
      checks: [
        ...linkList('ul', [['Bolt M8', 'parts/bolt-m8.html'], ['Gear 40T', 'parts/gear-40t.html'], ['Valve 12V', 'parts/valve-12v.html']]),
        web('The heading and the link back', "h.eq(h.text('h1'), 'Parts Catalogue'); const back = h.$$('a').find((a) => h.norm(a.textContent) === 'Back to the catalogue home'); h.assert(back, 'Add the link back.'); h.eq(back.getAttribute('href'), '../index.html'); h.assert(!back.closest('ul'), 'The link back is not one of the parts: keep it outside the list.'); h.assert(back.compareDocumentPosition(h.$('ul')) & Node.DOCUMENT_POSITION_PRECEDING, 'Put the link after the list.');", { visible: false }),
      ],
      xpReward: 65, coinReward: 9,
    }),
  ],
};
