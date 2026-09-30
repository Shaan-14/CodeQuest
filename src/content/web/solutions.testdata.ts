/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for web challenges.
 * Every `valid` must pass in real Chromium, every `wrong` must fail (see web.test.ts).
 */
import type { WebFiles } from '../schema';

export type Sol = { valid: WebFiles[]; wrong: WebFiles[] };
const f = (html: string, css = '', js = ''): WebFiles => ({ html, css, js });
export const doc = (title: string, body: string, head = ''): string => `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${title}</title>\n${head}</head>\n<body>\n${body}\n</body>\n</html>`;

const sections = (h1: string, names: string[]) => doc(h1, `<h1>${h1}</h1>\n` + names.map((n) => `<h2>${n}</h2>\n<p>Text about ${n.toLowerCase()}.</p>`).join('\n'));
const structureWrongs = (h1: string, names: string[]): WebFiles[] => [
  f(sections(h1, names).replace('<!DOCTYPE html>\n', '')),
  f(sections(h1, names).replace(' lang="en"', '')),
  f(sections(h1, names).replace(/<title>.*<\/title>/, '<title></title>')),
  f(sections(h1, names).replace(/<h2>/g, '<h3>').replace(/<\/h2>/g, '</h3>')),
  f(sections(h1, names).replace(`<h1>${h1}</h1>`, `<h2>${h1}</h2>`)),
  f(sections(h1, names).replace(/<p>Text[^<]*<\/p>/, '')),
  f(sections(h1, [...names].reverse())),
  f(sections(h1, names).replace('</body>', `<h1>${h1}</h1></body>`)),
];

import { cssSolutions } from './solutions.css';
import { htmlSolutions } from './solutions.html';

export const webSolutions: Record<string, Sol> = {
  ...htmlSolutions,
  ...cssSolutions,
  'web-01-hello-page': {
    valid: [f(doc('Machine M-7', '<h1>Machine M-7</h1>\n<p>Status: running</p>')), f('<!doctype html><html lang="en-GB"><head><title>Machine M-7</title></head><body><h1>Machine M-7</h1><p>Status: running</p></body></html>')],
    wrong: [
      f(doc('Machine M-7', '<h1>Machine M-7</h1>\n<p>Status: running</p>').replace('<!DOCTYPE html>\n', '')),
      f(doc('Machine M7', '<h1>Machine M-7</h1>\n<p>Status: running</p>')),
      f(doc('Machine M-7', '<h2>Machine M-7</h2>\n<p>Status: running</p>')),
      f(doc('Machine M-7', '<h1>Machine M-7</h1>\n<p>Status: stopped</p>')),
      f(doc('Machine M-7', '<h1>Machine M-7</h1>\n<p>Status: running</p>').replace(' lang="en"', '')),
      f('<!DOCTYPE html><html lang="en"><head><h1>Machine M-7</h1><title>Machine M-7</title></head><body><p>Status: running</p></body></html>'),
    ],
  },
  'web-01-report-page': { valid: [f(sections('Bridge Inspection Report', ['Findings', 'Recommendations']))], wrong: structureWrongs('Bridge Inspection Report', ['Findings', 'Recommendations']) },
  'web-01-product-page': { valid: [f(sections('TrailLite Headlamp', ['Description', 'Specifications', 'Reviews']))], wrong: structureWrongs('TrailLite Headlamp', ['Description', 'Specifications', 'Reviews']) },
  'web-01-race-page': { valid: [f(sections('Spa Grand Prix', ['Schedule', 'Circuit', 'Tickets', 'Results']))], wrong: structureWrongs('Spa Grand Prix', ['Schedule', 'Circuit', 'Tickets', 'Results']) },
};
