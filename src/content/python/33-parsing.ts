import { calls, text } from '../helpers';
import { refCalls } from '../daily/helpers';
import type { LessonBundle } from '../schema';

const KV_REF = "def _ref(line):\n    out = {}\n    for part in line.split(';'):\n        if '=' not in part:\n            continue\n        k, v = part.split('=', 1)\n        k, v = k.strip(), v.strip()\n        if k:\n            out[k] = v\n    return out";

const LOG_REF = "import re\nfrom datetime import datetime\n_pat = re.compile(r'^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(DEBUG|INFO|WARN|ERROR)\\] ([A-Za-z0-9_-]+): (.+?)(?: \\(code=(\\d+)\\))?$')\ndef _ref(line):\n    m = _pat.match(line.strip())\n    if not m:\n        return None\n    try:\n        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')\n    except ValueError:\n        return None\n    msg = m.group(4).strip()\n    if not msg:\n        return None\n    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': msg, 'code': int(m.group(5)) if m.group(5) else None}";

const TXN_REF = "import re\nfrom datetime import datetime\n_pat = re.compile(r'^TXN (\\d{4}-\\d{2}-\\d{2}) \\| (.+?) \\| ([+-]?\\d+(?:\\.\\d+)?) ([A-Z]{3})$')\ndef _ref(line):\n    m = _pat.match(line.strip())\n    if not m:\n        return None\n    try:\n        datetime.strptime(m.group(1), '%Y-%m-%d')\n    except ValueError:\n        return None\n    payee = m.group(2).strip()\n    if not payee:\n        return None\n    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}";

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-33-parsing', title: 'Parsing Messy Lines', language: 'python', skillId: 'py.text',
    blurb: 'Turn lines of text with a loose format into clean records, and reject the ones that do not fit instead of guessing.', prerequisites: ['py-21-cleaning'], xpReward: 80,
    reference: {
      title: 'Parsing text',
      body: text(
        '**Parsing** turns text into structured data. Start simple: `line.split(sep, 1)` splits on the first separator only; `partition(sep)` gives `(before, sep, after)`. Then validate each piece: `int(...)` and `float(...)` raise `ValueError` on nonsense; `datetime.strptime(text, "%Y-%m-%d")` raises `ValueError` for impossible dates such as `2024-02-30`.',
        'When the format has structure (fixed pieces around variable ones) a **regular expression** describes it in one line: `re.match(r"^(\\d{4})-(\\d{2}) (.+)$", line)` returns a match (or `None`) whose `.group(n)` are the captured pieces. Anchor with `^` and `$`, capture what you need in `( )`, make parts optional with `( )?`, and use `(.+?)` for a shortest-possible chunk. `re` is documented in the Field Manual; you do not need it, but it is worth knowing.',
        'The professional habit: **never guess**. A line that does not match returns `None` (or is counted and logged), so bad data is visible instead of silently becoming wrong numbers. Trim the line first, and test lines with extra spaces, missing pieces and impossible values.',
      ),
      example: 'import re\nm = re.match(r"^(\\w+)=(\\d+)$", "speed=42")\nif m:\n    key, value = m.group(1), int(m.group(2))',
    },
    steps: [
      { kind: 'teach', title: 'From lines to records', body: text('Logs, exports and instrument readouts arrive as lines of text. To use them you must turn each line into a record with named, typed fields: a timestamp that is really a date, an amount that is really a number. Most of the work is deciding what to do with lines that **do not fit**.') },
      {
        kind: 'demo', title: 'Split, convert, validate', language: 'python',
        body: text('Parse `key=value` pairs, and see which broken pieces get ignored.'),
        code: "line = 'a=1; b = two ;bad; =3; c=x=y'\nout = {}\nfor part in line.split(';'):\n    if '=' not in part:\n        continue\n    key, value = part.split('=', 1)\n    key, value = key.strip(), value.strip()\n    if key:\n        out[key] = value\nprint(out)",
        notice: '`bad` has no `=` and `=3` has no key, so both were skipped. `split(\'=\', 1)` kept `x=y` whole, because only the first `=` splits. Each rule was a decision about bad data.',
      },
      { kind: 'challenge', challengeId: 'py-33-parse-kv' },
      { kind: 'challenge', challengeId: 'py-33-parse-log' },
    ],
  },
  objectives: [
    { id: 'py-obj-parse-line', title: 'Parse a structured line into a record', summary: 'Extract typed fields from a line with a fixed format, and return None for lines that do not fit or hold impossible values.' },
  ],
  challenges: [
    {
      id: 'py-33-parse-kv', title: 'Read Settings from a Line', mode: 'learning', language: 'python', skillIds: ['py.text', 'de.cleaning'], concepts: ['split', 'partition', 'strip'], difficulty: 3, context: 'software',
      prompt: text('A tool stores settings on one line, separated by semicolons: `"host = db1; port=5432;debug"`. Write `parse_settings(line)` returning a dictionary of the settings, with keys and values as **text with the spaces around them removed**. A part without an `=` is ignored, and so is a part whose key is empty (`"=5"`). Only the **first** `=` in a part splits it, so `"url=a=b"` gives the value `"a=b"`. If a key appears twice, the last one wins.'),
      expectedBehavior: 'A dictionary of stripped key/value text, skipping malformed parts.',
      guidedSteps: ['Split the line on `";"` and loop over the parts.', 'Skip parts that have no `=`; otherwise `part.split("=", 1)` into key and value.', 'Strip both; skip an empty key; store the pair.'],
      starterCode: 'def parse_settings(line):\n    pass\n',
      hints: ['What should happen to a part that cannot be split into a key and a value?', '`split("=", 1)` limits the number of splits: what does that protect against?', 'Trim before you test for an empty key.'],
      checks: [
        ...calls('parse_settings', [[['host = db1; port=5432;debug'], { host: 'db1', port: '5432' }], [['url=a=b'], { url: 'a=b' }], [[''], {}]], 3),
        ...refCalls('parse_settings', KV_REF, ['"a=1;a=2"', '" ; ; "', '"=5;x= "', '"k =  v  ;"', '";;a=1;;"', '"a==b"', '"x=1; y"']),
      ],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-33-parse-log', objectiveId: 'py-obj-parse-line', title: 'Parse a Server Log Line', mode: 'challenge', language: 'python', skillIds: ['py.text', 'de.cleaning'], concepts: ['regex-or-split', 'strptime', 'validation'], difficulty: 4, context: 'operations',
      prompt: text('A server writes lines like `2024-03-05 14:22:07 [ERROR] db: connection lost (code=57)`. Write `parse_log_line(line)` returning a dictionary with the keys `"time"` (the timestamp text), `"level"`, `"source"`, `"message"` and `"code"` (an `int`, or `None` when the line has no code).', 'The format: a timestamp `YYYY-MM-DD HH:MM:SS` that must be a **real** date and time, a level in square brackets that is one of `DEBUG`, `INFO`, `WARN`, `ERROR`, a source made of letters, digits, `_` or `-` followed by a colon and a space, then the message (not empty). The message may end with ` (code=NNN)`; that suffix is not part of the message. Ignore spaces around the whole line. A line that does not fit exactly, or has an impossible date, gives `None`.'),
      expectedBehavior: 'A dictionary of the five fields for a valid line, None otherwise.',
      starterCode: '',
      hints: ['Which pieces have a fixed shape, and which are free text?', 'A shape can be checked by splitting carefully or by describing it in one pattern; either way, decide what makes a line invalid first.', 'A timestamp that looks right can still be impossible: what can you use to test it?'],
      checks: refCalls('parse_log_line', LOG_REF, ['"2024-03-05 14:22:07 [ERROR] db: connection lost (code=57)"', '"2024-03-05 14:22:07 [INFO] web-1: started"', '"  2024-03-05 14:22:07 [WARN] a_b: slow (code=7)  "', '"2024-02-30 10:00:00 [INFO] x: y"', '"2024-03-05 25:00:00 [INFO] x: y"', '"2024-03-05 14:22:07 [TRACE] x: y"', '"2024-03-05 14:22:07 [INFO] x:"', '"2024-03-05 14:22:07 [INFO] x: "', '"garbage"', '""', '"2024-03-05 14:22 [INFO] x: y"', '"2024-03-05 14:22:07 [INFO] bad source: y"', '"2024-03-05 14:22:07 [DEBUG] x: retry (code=x)"', '"2024-03-05 14:22:07 [ERROR] x: a: b (code=500)"', '"2024-03-05 14:22:07 [INFO] x: y (code=12) tail"']),
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-33-parse-txn', objectiveId: 'py-obj-parse-line', title: 'Parse a Bank Statement Line', mode: 'challenge', language: 'python', skillIds: ['py.text', 'de.cleaning'], concepts: ['regex-or-split', 'strptime', 'validation'], difficulty: 4, context: 'finance',
      prompt: text('A bank exports lines like `TXN 2024-03-05 | ACME LTD | -45.20 GBP`. Write `parse_transaction(line)` returning a dictionary with the keys `"date"` (the date text), `"payee"`, `"amount"` (a `float`) and `"currency"`.', 'The format: the word `TXN`, a space, a date `YYYY-MM-DD` that must be a **real** date, then three fields separated by ` | `: after the date the payee (any text that is not blank, spaces around it ignored), an amount with an optional `+` or `-` sign and optional decimals (`5`, `-45.20`, `+0.5`), and a currency of exactly three capital letters after a single space. Spaces around the whole line are ignored. Anything else, or an impossible date, gives `None`.'),
      expectedBehavior: 'A dictionary of the four fields for a valid line, None otherwise.',
      starterCode: '',
      hints: ['Which pieces have a fixed shape and which are free text?', 'Decide what makes a line invalid before you decide how to extract the pieces.', 'A date that looks right can still be impossible; something in the standard library can check.'],
      checks: refCalls('parse_transaction', TXN_REF, ['"TXN 2024-03-05 | ACME LTD | -45.20 GBP"', '"  TXN 2024-03-05 |  Cafe  | 5 EUR  "', '"TXN 2024-03-05 | X | +0.5 USD"', '"TXN 2024-02-30 | X | 1 USD"', '"TXN 2024-03-05 | | 1 USD"', '"TXN 2024-03-05 |   | 1 USD"', '"TXN 2024-03-05 | X | abc USD"', '"TXN 2024-03-05 | X | 1 usd"', '"TXN 2024-03-05 | X | 1 US"', '"TXN 2024-03-05 | X | 1 USDX"', '"TXN 2024-03-05 | X | 1USD"', '"TXN 2024-03-05 | X"', '"TXN 2024-03-05 | X | 1 USD | extra"', '"XTN 2024-03-05 | X | 1 USD"', '""', '"TXN 2024-03-05 | X | -.5 USD"', '"TXN 2024-03-05 | A B C | 1200 JPY"']),
      xpReward: 130, coinReward: 20,
    },
  ],
};
