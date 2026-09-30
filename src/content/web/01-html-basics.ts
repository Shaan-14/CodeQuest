import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, S, wc, web, webDemo } from './helpers';

/** Page-structure checks shared by the "build a page from a description" variants. */
const structure = (h1: string, sections: string[]) => [
  web('The document is set up properly', `${S.doctype}\n${S.lang}\n${S.title}`),
  web('One main heading', `h.eq(h.$$('h1').length, 1, 'A page has exactly one h1'); h.eq(h.text('h1'), ${JSON.stringify(h1)});`, { feedback: 'The h1 says what the whole page is about.' }),
  web('The sections, in order', `h.eq(h.$$('h2').map((e) => h.norm(e.textContent)), ${JSON.stringify(sections)}, 'The h2 headings');`, { feedback: 'Each section gets its own second-level heading.' }),
  web('Every section has text under its heading', `h.$$('h2').forEach((e) => { const n = e.nextElementSibling; h.assert(n && n.tagName === 'P' && h.norm(n.textContent).length > 3, 'Under "' + h.norm(e.textContent) + '" write a paragraph.'); });`, { visible: false }),
  web('Headings are used for structure, not styling', `h.assert(!h.exists('h3, h4, h5, h6') || h.exists('h2'), 'Do not skip heading levels.'); h.assert(h.$$('p').every((p) => !/^\\s*$/.test(p.textContent)), 'No empty paragraphs.');`, { visible: false }),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-01-html-basics', title: 'Your First Web Page', language: 'web', skillId: 'web.html',
    blurb: 'What HTML is, how a document is structured, and headings and paragraphs.', prerequisites: ['py-13-wake-robot'], xpReward: 45,
    reference: {
      title: 'HTML document structure',
      body: text(
        'A web page is a text file of **HTML**: a tree of **elements**. An element is a start tag, content and an end tag: `<p>Hello</p>`. Elements nest inside each other, and the browser builds the page from the tree. **Attributes** add information to a start tag: `<html lang="en">`.',
        'A complete document: `<!DOCTYPE html>` (use modern rules), then `<html lang="en">` containing a `<head>` (information ABOUT the page: `<title>`, `<meta charset="utf-8">`) and a `<body>` (what people see). Headings `<h1>` to `<h6>` give the outline (one `<h1>`; do not skip levels); `<p>` is a paragraph.',
      ),
      example: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>Machine M-7</title>\n  </head>\n  <body>\n    <h1>Machine M-7</h1>\n    <p>Status: running</p>\n  </body>\n</html>',
    },
    steps: [
      {
        kind: 'teach', title: 'What a web page really is',
        body: text(
          'Every web page you have ever seen started as **text** that a browser turned into pixels. That text is **HTML** (HyperText Markup Language). It does not run like Python: it *describes* a page, and the browser decides how to show it. The description says what each piece **is**: a heading, a paragraph, a link, a list.',
          'That “what it is” matters more than how it looks: search engines, screen readers and other programs all rely on it. So we start with meaning, and add looks (CSS) and behaviour (JavaScript) later.',
        ),
      },
      webDemo({
        title: 'A page in nine lines',
        body: text('Press Run. Then change the heading text, run again, and watch the page change. Try deleting a closing tag like `</p>` to see what the browser does with broken HTML.'),
        files: files('<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>Machine M-7</title>\n  </head>\n  <body>\n    <h1>Machine M-7</h1>\n    <p>Status: running</p>\n  </body>\n</html>\n'),
        notice: 'The `<title>` is in the tab of a real browser (not in the page), while the `<h1>` and `<p>` are the visible page. Browsers are forgiving: a missing end tag is repaired silently, which is why you should always check what your HTML really produced.',
      }),
      {
        kind: 'teach', title: 'Structure: the outline of a document',
        body: text(
          'Think of a document like a report: a title, then sections, each with a heading and text. `<h1>` is the title of the page; `<h2>` marks its sections; `<h3>` a subsection. **Do not choose a heading level because of its size** (CSS controls size). Choose it because of its **position in the outline**.',
          'Every document also declares itself: `<!DOCTYPE html>` at the very top and a language on `<html lang="en">`. The language helps screen readers pronounce text correctly and helps translation tools.',
        ),
      },
      { kind: 'challenge', challengeId: 'web-01-hello-page' },
      { kind: 'challenge', challengeId: 'web-01-report-page' },
    ],
  },
  objectives: [{ id: 'web-obj-page-structure', title: 'Build a complete, well-structured page from a description', summary: 'Doctype, language, title, one h1, and h2 sections with paragraphs.' }],
  challenges: [
    wc({
      id: 'web-01-hello-page', title: 'The Machine Page', mode: 'learning', skillIds: ['web.html'], concepts: ['doctype', 'head', 'title', 'headings', 'paragraphs'], difficulty: 1, context: 'engineering',
      prompt: text('Write the web page for machine **M-7**. The document needs the doctype declaration, an `html` element with `lang="en"`, a `head` containing a `title` of `Machine M-7`, and in the `body` a top-level heading with the text `Machine M-7` and a paragraph that says `Status: running`.'),
      expectedBehavior: 'The page shows a heading and a status paragraph, and is a properly declared document with a title.',
      guidedSteps: ['Start with `<!DOCTYPE html>`.', 'Add `<html lang="en">` ... `</html>` around everything else.', 'Inside it, a `<head>` with the `<title>`, and a `<body>`.', 'In the body: `<h1>` and `<p>`.'],
      starterFiles: files('<!-- Write your page here -->\n'), tabs: ['html'],
      hints: ['A page has two big parts: information about the page, and the page itself.', 'The title lives in the head; the heading and paragraph live in the body.', 'The example in your notes is nearly this page: change the words.'],
      checks: [
        web('The document is declared', `${S.doctype}\n${S.lang}`),
        web('The title', "h.eq(document.title.trim(), 'Machine M-7', 'The title in the head');"),
        web('The heading', "h.eq(h.$$('h1').length, 1, 'One h1'); h.eq(h.text('h1'), 'Machine M-7');"),
        web('The status paragraph', "h.eq(h.text('p'), 'Status: running', 'The paragraph text');"),
        web('Head and body are used properly', "h.assert(document.head.querySelector('title'), 'The title belongs in the head.'); h.assert(document.body.querySelector('h1') && document.body.querySelector('p'), 'The heading and paragraph belong in the body.');", { visible: false }),
      ],
      xpReward: 45, coinReward: 6,
    }),
    wc({
      id: 'web-01-report-page', objectiveId: 'web-obj-page-structure', title: 'Inspection Report', mode: 'challenge', skillIds: ['web.html'], concepts: ['doctype', 'head', 'title', 'headings', 'paragraphs'], difficulty: 2, context: 'engineering',
      prompt: text('An engineering firm wants a page for its inspection report. It needs a title in the browser tab, and a page with the main heading `Bridge Inspection Report` and two sections with headings `Findings` and `Recommendations`. Each section starts with a paragraph of text (write anything sensible). Declare the document properly, including its language.'),
      expectedBehavior: 'A complete document: one main heading, and two headed sections each followed by a paragraph.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Decide the outline first: one title, two sections.', 'Section headings sit one level below the page heading, and each is followed by its text.', 'Do not forget the parts of a document that are not visible: doctype, language, title.'],
      checks: structure('Bridge Inspection Report', ['Findings', 'Recommendations']),
      xpReward: 65, coinReward: 9,
    }),
    wc({
      id: 'web-01-product-page', objectiveId: 'web-obj-page-structure', title: 'Product Page', mode: 'challenge', skillIds: ['web.html'], concepts: ['doctype', 'head', 'title', 'headings', 'paragraphs'], difficulty: 2, context: 'retail',
      prompt: text('A shop sells the `TrailLite Headlamp` and needs its product page: a browser-tab title, the main heading `TrailLite Headlamp`, and three sections headed `Description`, `Specifications` and `Reviews`. Each section starts with a paragraph. Declare the document properly, including its language.'),
      expectedBehavior: 'A complete document: one main heading, and three headed sections each followed by a paragraph.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Outline first: what is the page about, and what are its parts?', 'One page heading; the three parts are headings one level lower, each followed by text.', 'Also declare the document: doctype, language, title.'],
      checks: structure('TrailLite Headlamp', ['Description', 'Specifications', 'Reviews']),
      xpReward: 65, coinReward: 9,
    }),
    wc({
      id: 'web-01-race-page', objectiveId: 'web-obj-page-structure', title: 'Race Weekend Page', mode: 'challenge', skillIds: ['web.html'], concepts: ['doctype', 'head', 'title', 'headings', 'paragraphs'], difficulty: 2, context: 'motorsport',
      prompt: text('A racing club wants a page for its event. It needs a browser-tab title, the main heading `Spa Grand Prix`, and sections headed `Schedule`, `Circuit`, `Tickets` and `Results`, each starting with a paragraph. Declare the document properly, including its language.'),
      expectedBehavior: 'A complete document: one main heading, and four headed sections each followed by a paragraph.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Start from the outline of the page.', 'Sections are one heading level below the page heading; each is followed by text.', 'Doctype, language and title make it a real document.'],
      checks: structure('Spa Grand Prix', ['Schedule', 'Circuit', 'Tickets', 'Results']),
      xpReward: 65, coinReward: 9,
    }),
  ],
};
