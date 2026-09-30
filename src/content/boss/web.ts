import type { Challenge } from '../schema';
import { files, jsCalls, web } from '../web/helpers';
import { wc } from '../web/helpers';
import type { WebCheck } from '../schema';

type WebBossDef = Omit<Challenge, 'language' | 'mode' | 'hints' | 'concepts' | 'xpReward' | 'coinReward' | 'starterCode' | 'checks'> & { tabs: ('html' | 'css' | 'js')[]; checks: WebCheck[]; starterFiles: ReturnType<typeof files> };
const bossChallenge = (d: WebBossDef): Challenge => { const { tabs, checks, starterFiles, ...rest } = d; return wc({ ...rest, mode: 'independent', concepts: [], hints: [], xpReward: 0, coinReward: 0, transfer: true, starterFiles, tabs, checks }); };

/** Web boss versions. Graded in real Chromium (see content/web/web.test.ts, which also runs these). */
const T = (name: string, script: string, o: Parameters<typeof web>[2] = {}) => web(name, script, { visible: false, ...o });

export const ROSTER_HTML = '<label>Search <input id="q"></label>\n<label>Role <select id="role"><option value="">All</option><option value="Pitcher">Pitcher</option><option value="Catcher">Catcher</option><option value="Outfield">Outfield</option></select></label>\n<p id="count"></p>\n<ul id="roster">\n  <li data-role="Pitcher">Ana Reyes</li>\n  <li data-role="Catcher">Bo Tanaka</li>\n  <li data-role="Outfield">Cy Okafor</li>\n  <li data-role="Pitcher">Dee Haddad</li>\n  <li data-role="Outfield">Eli Reyes</li>\n</ul>\n';
export const CHECKLIST_HTML = '<h2>Pre-flight checks</h2>\n<p id="progress"></p>\n<ul id="checks">\n  <li><label><input type="checkbox" data-id="fuel"> Fuel</label></li>\n  <li><label><input type="checkbox" data-id="oil"> Oil</label></li>\n  <li><label><input type="checkbox" data-id="tyres"> Tyres</label></li>\n  <li><label><input type="checkbox" data-id="lights"> Lights</label></li>\n</ul>\n';

const shown = "const shown = () => h.$$('#roster li').filter((li) => !li.hidden && getComputedStyle(li).display !== 'none').map((li) => li.textContent.trim());";
const done = "const doneIds = () => h.$$('#checks input').filter((i) => i.checked).map((i) => i.dataset.id);";

export const webBossChallenges: Challenge[] = [
  bossChallenge({
    id: 'boss-web-script-a', title: 'The Script Sentinel: Batches', skillIds: ['js.basics', 'js.data'], difficulty: 3, context: 'logistics',
    boss: { bossId: 'mini-web-scripts', version: 'a' },
    prompt: 'A shipping tool packs items into boxes. Write `pack(items, size)` returning a **new** list of lists, each holding up to `size` items in the original order (`pack([1,2,3,4,5], 2)` is `[[1,2],[3,4],[5]]`). An empty list gives an empty list. A `size` below 1 is a mistake: throw an `Error`.',
    starterFiles: files('', '', ''), tabs: ['js'],
    checks: [
      ...jsCalls('pack', '(items, size) => { if (size < 1) throw new Error("bad"); const out = []; for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size)); return out; }', ['[1,2,3,4,5], 2', '[], 3', '[1,2,3], 3', '[1,2,3], 5', '["a","b","c","d"], 1', '[1,2,3,4,5,6,7], 3'], { pure: true }).map((c) => ({ ...c, visible: false })),
      T('A size below 1 is refused', "let threw = false; try { pack([1, 2], 0); } catch (e) { threw = e instanceof Error; } h.assert(threw, 'pack with size 0 should throw an Error'); threw = false; try { pack([1], -1); } catch (e) { threw = e instanceof Error; } h.assert(threw, 'A negative size should throw an Error too');"),
    ],
  }),
  bossChallenge({
    id: 'boss-web-script-b', title: 'The Script Sentinel: Tally Ho', skillIds: ['js.basics', 'js.data'], difficulty: 3, context: 'operations',
    boss: { bossId: 'mini-web-scripts', version: 'b' },
    prompt: 'Write `mostCommon(words)` returning the word that appears most often in a list, ignoring upper/lower case and spaces around each word, in lower case. If several words tie, return the one that reached that count **first** while reading from the start. An empty list returns `null`.',
    starterFiles: files('', '', ''), tabs: ['js'],
    checks: jsCalls('mostCommon', '(words) => { const c = new Map(); let best = null, n = 0; for (const w of words) { const k = w.trim().toLowerCase(); const v = (c.get(k) || 0) + 1; c.set(k, v); if (v > n) { n = v; best = k; } } return best; }', ['[]', '["a"]', '["a","b","b","a"]', '["b","a","a","b"]', '[" Cat","cat ","DOG","dog","dog"]', '["x","y","z"]', '["Ab","aB","ab","c","c"]', '["q","r","r","q","q"]', '[" a","a ","b","b"," a"]'], { pure: true }).map((c) => ({ ...c, visible: false })),
  }),
  bossChallenge({
    id: 'boss-web-mastery-a', title: 'Mastery Trial: The Roster Filter', skillIds: ['js.dom', 'js.forms', 'web.semantics'], difficulty: 4, context: 'sports', 
    boss: { bossId: 'mastery-web', version: 'a' },
    prompt: 'The roster page lists players. Make the search box and the role menu filter the list together: a player is shown only when their name contains what was typed (ignoring upper/lower case and spaces around the search text) **and** their role matches the chosen role (the empty choice means every role). Hide the others (do not delete them). `#count` always says how many are shown, like `3 shown`, and says `No matches` when none are.\n\nThe page must show the correct state as soon as it opens.',
    starterFiles: files(ROSTER_HTML, '', ''), tabs: ['js'],
    checks: [
      T('Opening state', shown + "h.eq(shown().length, 5); h.eq(h.text('#count'), '5 shown');"),
      T('Search', shown + "h.type('#q', 'reyes'); h.eq(shown(), ['Ana Reyes', 'Eli Reyes']); h.eq(h.text('#count'), '2 shown'); h.type('#q', '  BO '); h.eq(shown(), ['Bo Tanaka']); h.eq(h.text('#count'), '1 shown');"),
      T('Role and search together', shown + "h.select('#role', 'Outfield'); h.eq(shown(), ['Cy Okafor', 'Eli Reyes']); h.type('#q', 'reyes'); h.eq(shown(), ['Eli Reyes']); h.select('#role', 'Pitcher'); h.eq(shown(), ['Ana Reyes']); h.select('#role', ''); h.eq(shown(), ['Ana Reyes', 'Eli Reyes']);"),
      T('No matches and recovery', shown + "h.type('#q', 'zzz'); h.eq(shown(), []); h.eq(h.text('#count'), 'No matches'); h.type('#q', ''); h.eq(shown().length, 5); h.eq(h.text('#count'), '5 shown'); h.select('#role', 'Catcher'); h.type('#q', 'cy'); h.eq(h.text('#count'), 'No matches');"),
      T('Items are hidden, not removed', "h.type('#q', 'xyz'); h.eq(h.$$('#roster li').length, 5, 'The list items must still exist in the page.');"),
    ],
  }),
  bossChallenge({
    id: 'boss-web-mastery-b', title: 'Mastery Trial: The Remembering Checklist', skillIds: ['js.dom', 'js.forms', 'web.http'], difficulty: 4, context: 'aviation', 
    boss: { bossId: 'mastery-web', version: 'b' },
    prompt: 'A pre-flight checklist must survive a page reload. The checked items are remembered between visits under the storage key `done` as a JSON list of the checked item ids (each checkbox has a `data-id`). When the page opens, tick the remembered items. `#progress` always reads like `2 of 4 done`, and `All done!` when every box is ticked. If what was stored is missing, damaged, or contains ids that do not exist, ignore the unusable parts and carry on.',
    starterFiles: files(CHECKLIST_HTML, '', ''), tabs: ['js'],
    checks: [
      T('Opening state', done + "h.eq(doneIds(), []); h.eq(h.text('#progress'), '0 of 4 done');"),
      T('Ticking and progress', done + "h.check('[data-id=oil]', true); h.check('[data-id=fuel]', true); h.eq(h.text('#progress'), '2 of 4 done'); h.check('[data-id=oil]', false); h.eq(h.text('#progress'), '1 of 4 done'); h.check('[data-id=oil]', true); h.check('[data-id=tyres]', true); h.check('[data-id=lights]', true); h.eq(h.text('#progress'), 'All done!');"),
      T('It is saved as a JSON list', "h.check('[data-id=tyres]', true); h.check('[data-id=fuel]', true); const raw = h.storage.getItem('done'); h.assert(raw !== null, 'Nothing was saved under the key done.'); const list = JSON.parse(raw); h.assert(Array.isArray(list), 'The value must be a JSON list.'); h.eq([...list].sort(), ['fuel', 'tyres']); h.check('[data-id=fuel]', false); h.eq(JSON.parse(h.storage.getItem('done')), ['tyres']);"),
      T('Restoring', done + "h.eq(doneIds().sort(), ['lights', 'oil']); h.eq(h.text('#progress'), '2 of 4 done');", { storage: { done: '["oil","lights"]' } }),
      T('Damaged or odd storage', done + "h.eq(doneIds(), []); h.eq(h.text('#progress'), '0 of 4 done'); h.check('[data-id=fuel]', true); h.eq(h.text('#progress'), '1 of 4 done');", { storage: { done: '{not json' } }),
      T('Unknown ids and wrong shapes', done + "h.eq(doneIds(), ['fuel']); h.eq(h.text('#progress'), '1 of 4 done');", { storage: { done: '["fuel","wings",42,null]' } }),
      T('Not a list', done + "h.eq(doneIds(), []); h.eq(h.text('#progress'), '0 of 4 done');", { storage: { done: '{"fuel":true}' } }),
      T('Everything restored', "h.eq(h.text('#progress'), 'All done!');", { storage: { done: '["fuel","oil","tyres","lights"]' } }),
    ],
  }),
];
