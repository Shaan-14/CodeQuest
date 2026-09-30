import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/** Tag-balance check on the RAW source: every start tag of these elements needs an end tag. Browsers silently repair mistakes, so we look at the source. */
const BALANCED = "const src = h.files.html.replace(/<!--[\\s\\S]*?-->/g, ''); ['p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'section', 'div', 'a', 'form', 'label', 'strong', 'em', 'button', 'select', 'textarea'].forEach((t) => { const open = (src.match(new RegExp('<' + t + '(\\\\s[^>]*)?>', 'gi')) || []).length; const close = (src.match(new RegExp('</' + t + '>', 'gi')) || []).length; h.eq(open, close, 'Start and end tags of <' + t + '> must match (' + open + ' start, ' + close + ' end)'); });";

const fixChecks = (extra: ReturnType<typeof web>[]) => [
  web('Every tag is closed', BALANCED, { feedback: 'Read the source line by line: which element opens but never closes? The browser hides the damage.' }),
  ...extra,
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-06-html-debugging', title: 'Debugging HTML', language: 'web', skillId: 'web.html',
    blurb: 'Browsers repair broken HTML silently. Learn to find the bugs anyway (and use developer tools).', prerequisites: ['web-05-forms'], xpReward: 50,
    reference: {
      title: 'Debugging HTML and browser developer tools',
      body: text(
        'Browsers never show an “HTML error”: they **repair** mistakes and carry on, so a bug appears as a page that looks or behaves wrong. To debug: (1) read your source for unclosed or mis-nested tags; (2) open the browser **developer tools** (F12 / right-click → Inspect) and look at the **Elements** panel, which shows the DOM the browser actually built from your text; (3) compare it with what you meant.',
        'Common bugs: an unclosed tag swallowing what follows, elements nested in the wrong order (`<b><i>x</b></i>`), a `<p>` inside a `<p>`, skipped heading levels, an image without `alt`, an input without a label, table cells outside a row. **Work on one thing at a time and re-check the result.**',
      ),
      example: '<!-- Bug: the <li> elements are inside a <p>, but a <p> cannot contain a list -->\n<p>Steps:\n<ol><li>Isolate</li></ol></p>',
    },
    steps: [
      { kind: 'teach', title: 'Bugs that hide', body: text('In Python a mistake stops the program with an error. HTML is different: the browser **guesses** what you meant, so a broken page still shows *something*. That makes HTML bugs quiet, and it makes one habit essential: look at what the browser actually built, not only at what you typed.', 'Every browser has developer tools. The **Elements** panel is the browser’s view of your page as a tree. If your source and that tree disagree, you have found a bug.') },
      webDemo({
        title: 'What the browser really built',
        body: text('This source has a mistake. Run it and compare what you see with what you expected. In a real browser you would open **Inspect** and see the repaired tree.'),
        files: files('<h1>Checklist</h1>\n<p>Before starting the press:\n<ul>\n  <li>Check the guard</li>\n  <li>Check the oil\n</ul>\n<p>Then press START.</p>\n'),
        notice: 'A `<p>` is closed automatically when a list starts, and the second `<li>` is closed silently at `</ul>`. The page “works”, but only by accident. Fixing the source makes it dependable.',
      }),
      { kind: 'challenge', challengeId: 'web-06-fix-report' },
      { kind: 'challenge', challengeId: 'web-06-fix-shop-page' },
    ],
  },
  objectives: [{ id: 'web-obj-fix-html', title: 'Find and fix broken HTML', summary: 'Repair unclosed tags, bad nesting, missing alt text and labels, and table structure.' }],
  challenges: [
    wc({
      id: 'web-06-fix-report', objectiveId: 'web-obj-fix-html', title: 'Fix the Broken Report', mode: 'challenge', skillIds: ['web.html', 'web.debugging'], concepts: ['unclosed tags', 'nesting', 'alt text', 'heading order'], difficulty: 3, context: 'engineering',
      prompt: text('This inspection report is broken in several ways: some tags are never closed, an image has no alternative text (it shows a photo of a corroded valve), a heading level is skipped, and the table rows are not built properly. Fix the source so that it is correct HTML. Keep all the content and the same overall meaning.'),
      expectedBehavior: 'Every element is closed, headings go h1 then h2, the image has alt text, and the table has proper rows.',
      starterFiles: files('<h1>Valve Inspection\n<h3>Summary</h3>\n<p>The valve is corroded.\n<img src="valve.jpg">\n<h3>Readings</h3>\n<table>\n<tr><th>Point<th>Value</th></tr>\n<td>A</td><td>4.5</td>\n<tr><td>B</td><td>5.1</td></tr>\n</table>\n<ul><li>Replace seal<li>Repaint</ul>\n'), tabs: ['html'],
      hints: ['Read from the top: which element opens and is never closed?', 'Some problems are about meaning: the outline, the image, the table structure.', 'Close the h1 and p; make the headings h2; give the image descriptive alt text; put every row of cells inside a tr, and close every cell and list item.'],
      checks: fixChecks([
        web('The outline is in order', "h.eq(h.$$('h1').length, 1); h.eq(h.text('h1'), 'Valve Inspection'); h.eq(h.$$('h2').map((e) => h.norm(e.textContent)), ['Summary', 'Readings']); h.assert(!h.exists('h3'), 'Do not skip heading levels.');"),
        web('The image is described', "const i = h.$('img'); h.assert(i, 'Keep the image.'); h.assert((i.getAttribute('alt') || '').trim().length >= 12, 'Describe the photo (a corroded valve) in the alt text.');"),
        web('The table has proper rows', "const rows = h.$$('table tr'); h.eq(rows.length, 3, 'Three rows'); rows.forEach((r) => h.assert(r.children.length === 2, 'Each row has two cells')); h.eq(h.$$('table td').length + h.$$('table th').length, 6); h.eq(h.$$('table > tr').length + h.$$('table > tbody > tr').length + h.$$('table > thead > tr').length, 3); h.assert(h.files.html.replace(/<!--[\\s\\S]*?-->/g, '').match(/<tr>/gi).length === 3, 'Write each row with its own tr.');", { visible: false }),
        web('Content is preserved', "h.eq(h.$$('table th, table td').map((c) => h.norm(c.textContent)), ['Point', 'Value', 'A', '4.5', 'B', '5.1']); h.eq(h.$$('ul > li').map((l) => h.norm(l.textContent)), ['Replace seal', 'Repaint']); h.assert(/corroded/.test(h.text('p')));", { visible: false }),
      ]),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-06-fix-shop-page', objectiveId: 'web-obj-fix-html', title: 'Fix the Broken Shop Page', mode: 'challenge', skillIds: ['web.html', 'web.debugging'], concepts: ['unclosed tags', 'nesting', 'alt text', 'heading order'], difficulty: 3, context: 'retail',
      prompt: text('A shop’s product page is broken: some tags are never closed, the product photo (a red safety helmet) has no alternative text, a heading level is skipped, and the price table rows are not built properly. Fix the source so it is correct HTML. Keep all the content and the same overall meaning.'),
      expectedBehavior: 'Every element is closed, headings go h1 then h2, the image has alt text, and the table has proper rows.',
      starterFiles: files('<h1>Safety Helmet\n<h3>Details</h3>\n<p>Lightweight and tough.\n<img src="helmet.jpg">\n<h3>Prices</h3>\n<table>\n<tr><th>Size<th>Price</th></tr>\n<td>M</td><td>19.99</td>\n<tr><td>L</td><td>21.99</td></tr>\n</table>\n<ol><li>Add to basket<li>Checkout</ol>\n'), tabs: ['html'],
      hints: ['Look for every element that opens and never closes.', 'Then check the meaning: outline, image, table.', 'Close everything; the headings are h2 under an h1; describe the photo; every cell sits inside a row.'],
      checks: fixChecks([
        web('The outline is in order', "h.eq(h.$$('h1').length, 1); h.eq(h.text('h1'), 'Safety Helmet'); h.eq(h.$$('h2').map((e) => h.norm(e.textContent)), ['Details', 'Prices']); h.assert(!h.exists('h3'), 'Do not skip heading levels.');"),
        web('The image is described', "const i = h.$('img'); h.assert(i, 'Keep the image.'); h.assert((i.getAttribute('alt') || '').trim().length >= 12, 'Describe the photo (a red safety helmet) in the alt text.');"),
        web('The table has proper rows', "const rows = h.$$('table tr'); h.eq(rows.length, 3, 'Three rows'); rows.forEach((r) => h.assert(r.children.length === 2, 'Each row has two cells')); h.assert(h.files.html.replace(/<!--[\\s\\S]*?-->/g, '').match(/<tr>/gi).length === 3, 'Write each row with its own tr.');", { visible: false }),
        web('Content is preserved', "h.eq(h.$$('table th, table td').map((c) => h.norm(c.textContent)), ['Size', 'Price', 'M', '19.99', 'L', '21.99']); h.eq(h.$$('ol > li').map((l) => h.norm(l.textContent)), ['Add to basket', 'Checkout']); h.assert(/lightweight/i.test(h.text('p')));", { visible: false }),
      ]),
      xpReward: 80, coinReward: 12,
    }),
  ],
};
