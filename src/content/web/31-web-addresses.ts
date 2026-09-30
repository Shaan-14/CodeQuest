import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, jsCalls, wc, webDemo } from './helpers';

const QUERY_REF = '(s) => { const out = {}; for (const [k, v] of new URLSearchParams(s)) out[k] = v; return out; }';
const BUILD_REF = '(p) => Object.keys(p).filter((k) => p[k] !== null && p[k] !== undefined).sort().map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(String(p[k]))).join("&")';
const ORIGIN_REF = '(a, b) => { try { const x = new URL(a); const y = new URL(b); return (x.protocol === "http:" || x.protocol === "https:") && x.protocol === y.protocol && x.origin === y.origin; } catch (e) { return false; } }';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-31-web-addresses', title: 'Reading and Building Web Addresses', language: 'web', skillId: 'web.http',
    blurb: 'Addresses have parts and rules. Take them apart, put them together, and compare them, using what the browser already provides.', prerequisites: ['web-17-js-errors'], xpReward: 70,
    reference: {
      title: 'URLs and query strings',
      body: text(
        'A web address has **parts**: `https://user@shop.example:8443/items/list?sort=price&page=2#top` is protocol `https:`, host `shop.example`, port `8443`, path `/items/list`, **query** `?sort=price&page=2` and fragment `#top`. The **origin** (protocol + host + port) is what browsers use to decide what may talk to what.',
        'The browser gives you tools so you never split addresses by hand: **`new URL(text)`** parses an address (and *throws* for text that is not one); its properties (`origin`, `hostname`, `pathname`, `searchParams`) do the rest. **`URLSearchParams`** reads and writes the query part; note it writes a space as `+`. **`encodeURIComponent(text)`** makes any text safe for one query value, writing a space as `%20`, and `decodeURIComponent` reverses it. Splitting on `&` and `=` yourself breaks as soon as a value contains those characters.',
        'Comparing addresses by *text* is a classic security bug: `http://a.com:80/` and `http://a.com` are the same place, `http://a.com.evil.com` is not, and `http://a.com@evil.com` actually goes to `evil.com`. Let the parser decide.',
      ),
      example: 'const u = new URL("https://shop.example:8443/items?sort=price&page=2");\nconsole.log(u.origin, u.pathname, u.searchParams.get("page"));\nconsole.log(encodeURIComponent("a b&c=d"));',
    },
    steps: [
      { kind: 'teach', title: 'Addresses are structured data', body: text('An address looks like text, but it has rules: what may appear where, which characters must be escaped, which parts are optional and which defaults apply (port 80 for `http`). Code that treats it as plain text ends up with subtle bugs, some of them security holes.', 'Two practical skills: **reading** a query string into an object, and **building** a correct one from an object. Then, in the last two tasks, you get a description of a job and no tool names: finding the right built-in is part of the work.') },
      webDemo({
        title: 'Parse, escape, compare',
        body: text('Run it and read the console. Notice what `URLSearchParams` does with a space and with the same key twice.'),
        files: files('', '', 'const u = new URL("http://Shop.Example:80/items?sort=price&sort=name&q=nuts%20and+bolts#top");\nconsole.log(u.origin, u.pathname);\nconsole.log(u.searchParams.get("sort"), u.searchParams.getAll("sort").join("|"), u.searchParams.get("q"));\nconsole.log(encodeURIComponent("a b&c=d"), new URLSearchParams({ q: "a b" }).toString());\ntry { new URL("not an address"); } catch (e) { console.log("error:", e.name); }'),
        notice: 'The origin lost the default port `:80` and lower-cased the host. `get` returns the first `sort`, `getAll` both. The `+` in the query became a space, and `URLSearchParams` writes a space back as `+` while `encodeURIComponent` writes `%20`. Invalid text throws a `TypeError`.',
      }),
      { kind: 'challenge', challengeId: 'web-31-parse-query' },
      { kind: 'challenge', challengeId: 'web-31-build-query' },
    ],
  },
  objectives: [
    { id: 'js-obj-url-api', title: 'Use the browser’s address tools instead of string surgery', summary: 'Find and use the built-in tools for encoding and comparing web addresses, and handle invalid input.' },
  ],
  challenges: [
    wc({
      id: 'web-31-parse-query', title: 'Read a Query String', mode: 'learning', skillIds: ['web.http', 'js.basics'], concepts: ['URLSearchParams', 'decoding', 'query-string'], difficulty: 3, context: 'analytics',
      prompt: text('Write `parseQuery(search)` that turns a query string such as `"?sort=price&page=2&q=nuts%20and+bolts"` into an object of text values: `{ sort: "price", page: "2", q: "nuts and bolts" }`. The leading `?` is optional. Encoded characters (`%20`, `+`) are decoded. If a key appears more than once, the **last** value wins. An empty string gives `{}`.', 'Look at `URLSearchParams` in the Field Manual.'),
      expectedBehavior: 'An object of decoded values; later duplicates win.',
      guidedSteps: ['Create a `URLSearchParams` from the text (it ignores a leading `?`).', 'Loop over it with `for (const [key, value] of params)`.', 'Store each pair in a plain object.'],
      starterFiles: files('', '', 'function parseQuery(search) {\n}\n'), tabs: ['js'],
      hints: ['You do not need to split the text yourself: which built-in reads query strings?', 'Iterating it gives `[key, value]` pairs in order; what happens to a repeated key if you assign each to an object?', 'Check what it does with `+` and a leading `?`.'],
      checks: jsCalls('parseQuery', QUERY_REF, ['"?sort=price&page=2&q=nuts%20and+bolts"', '"a=1&a=2&a=3"', '""', '"?"', '"x=%26%3D&y=caf%C3%A9"', '"flag"', '"a=&b"', '"?k=v=w"'], { visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-31-build-query', objectiveId: 'js-obj-url-api', title: 'Build a Tracking Link', mode: 'independent', skillIds: ['web.http', 'js.basics'], concepts: [], difficulty: 3, transfer: true, context: 'marketing',
      prompt: text('A marketing tool adds tracking information to links. Write `buildQuery(params)` that turns an object such as `{ q: "nuts & bolts", page: 2 }` into query text **without** a leading `?`: pairs `key=value` joined by `&`, **sorted by key** (plain text ordering), with both keys and values written so that any character is safe in a web address and **spaces are written as `%20`**. A value that is `null` or `undefined` is left out altogether; numbers and booleans are written as their text. An empty object gives `""`. For the example: `page=2&q=nuts%20%26%20bolts`.'),
      starterFiles: files('', '', ''), tabs: ['js'], hints: [],
      checks: jsCalls('buildQuery', BUILD_REF, ['{}', '{ q: "nuts & bolts", page: 2 }', '{ b: 1, a: 2 }', '{ "x y": "&=?" }', '{ a: null, b: undefined, c: 0 }', '{ flag: true, off: false }', '{ e: "é", u: "日本" }', '{ a: "" }', '{ Z: 1, a: 2, B: 3 }', '{ p: "100%" }', '{ s: "a+b" }'], { group: 4 }),
      xpReward: 110, coinReward: 16,
    }),
    wc({
      id: 'web-31-same-origin', objectiveId: 'js-obj-url-api', title: 'Is This the Same Site?', mode: 'independent', skillIds: ['web.http', 'js.basics'], concepts: [], difficulty: 3, transfer: true, context: 'security',
      prompt: text('A security filter must decide whether two web addresses belong to the **same site**: same protocol, same host and same port, where a missing port means the default for the protocol (80 for `http`, 443 for `https`) and letter case in the host does not matter. Path, query and fragment are ignored. Write `sameSite(a, b)` returning `true` or `false`. Only `http` and `https` addresses count; anything else, including text that is not an address at all, gives `false`. Be careful with tricks such as `http://a.com@evil.com`.'),
      starterFiles: files('', '', ''), tabs: ['js'], hints: [],
      checks: jsCalls('sameSite', ORIGIN_REF, ['"http://a.com/x", "http://a.com/y"', '"http://a.com", "https://a.com"', '"http://a.com:80/", "http://a.com"', '"https://a.com:8443", "https://a.com"', '"https://a.com:443", "https://a.com/x"', '"http://A.com", "http://a.com"', '"http://a.com", "http://b.com"', '"not a url", "http://a.com"', '"http://a.com", ""', '"ftp://a.com", "ftp://a.com"', '"http://a.com@evil.com", "http://evil.com"', '"http://a.com@evil.com", "http://a.com"', '"http://a.com.evil.com", "http://a.com"', '"http://a.com?q=1", "http://a.com#x"', '"mailto:x@a.com", "mailto:x@a.com"', '"http://a.com:8080", "http://a.com:8081"'], { group: 4 }),
      xpReward: 110, coinReward: 16,
    }),
  ],
};
