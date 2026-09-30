import { calls, text } from '../helpers';
import { refCalls } from '../daily/helpers';
import type { LessonBundle } from '../schema';

const SLUG_REF = "def _ref(t):\n    out, chunk = [], ''\n    for ch in t.lower():\n        if ch in 'abcdefghijklmnopqrstuvwxyz0123456789':\n            chunk += ch\n        elif chunk:\n            out.append(chunk)\n            chunk = ''\n    if chunk:\n        out.append(chunk)\n    return '-'.join(out)";
const CODE_REF = "def _ref(t):\n    out, chunk = [], ''\n    for ch in t.upper():\n        if ch in ' -/_':\n            if chunk:\n                out.append(chunk)\n                chunk = ''\n        elif ch.isascii() and ch.isalnum():\n            chunk += ch\n    if chunk:\n        out.append(chunk)\n    return '-'.join(out)";
const NAME_REF = "def _ref(raw):\n    return ' '.join('-'.join(p.capitalize() for p in w.split('-')) for w in raw.split())";

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-29-text-processing', title: 'Taming Text', language: 'python', skillId: 'py.text',
    blurb: 'Real text is messy: spaces in the wrong places, mixed case, stray punctuation. Split, clean and rebuild it reliably.', prerequisites: ['py-16-dicts'], xpReward: 60,
    reference: {
      title: 'Text processing',
      body: text(
        'Strings are **immutable**: every method returns a new string. `strip()` trims the ends, `lower()`/`upper()`/`capitalize()` change case, `replace(a, b)` swaps text, `split()` (no argument) splits on **any run of whitespace** and drops empty pieces, `"sep".join(pieces)` glues them back. `"-".join(part.capitalize() for part in name.split("-"))` shows the split → transform → join pattern.',
        'To classify characters use `ch.isalpha()`, `ch.isdigit()`, `ch.isalnum()`, `ch.isspace()`. Careful: they accept **non-ASCII** letters too (`"è".isalpha()` is `True`); when the rule says only `a-z`, test membership in `"abcdefghijklmnopqrstuvwxyz"` (or `ch.isascii()`).',
        'Build the result **character by character** when the rule is about runs (for example "any run of separators becomes one dash"): keep a `chunk`, add to it on good characters, and flush it when you hit a separator. Test the ends: empty text, only separators, separators at the start and the end.',
      ),
      example: 'words = "  many   spaces  here ".split()\nprint("-".join(words))   # many-spaces-here',
    },
    steps: [
      { kind: 'teach', title: 'Text is data too', body: text('Names typed on forms, product titles, part codes, addresses: almost all real-world data starts life as messy text. Most bugs are not in the arithmetic; they are in the **edges**: a double space, a trailing dash, an accent, an empty string.', 'The core tools are few: **split** text into pieces, **transform** each piece, **join** them back. Add a way to look at one character at a time and you can handle nearly anything.') },
      {
        kind: 'demo', title: 'Split, transform, join', language: 'python',
        body: text('`split()` with no argument treats any amount of whitespace as one separator, so double spaces and tabs vanish.'),
        code: "raw = '   ada    LOVELACE  '\nwords = raw.split()\nprint(words)\nprint(' '.join(w.capitalize() for w in words))\nprint(repr(raw.strip()))\nprint('Ünïcode'.isalpha(), 'é'.isascii())",
        notice: '`split()` gave clean words without any `strip` needed. The last line shows why `isalpha()` alone is not enough when only a–z is allowed: accented letters count as letters.',
      },
      { kind: 'challenge', challengeId: 'py-29-clean-name' },
      { kind: 'challenge', challengeId: 'py-29-slugify' },
    ],
  },
  objectives: [
    { id: 'py-obj-normalise-text', title: 'Normalise messy text by runs of separators', summary: 'Rebuild text from its useful characters: collapse runs of separators, fix case, and trim the ends.' },
  ],
  challenges: [
    {
      id: 'py-29-clean-name', title: 'Tidy a Typed Name', mode: 'learning', language: 'python', skillIds: ['py.text', 'py.strings'], concepts: ['split', 'join', 'capitalize'], difficulty: 2, context: 'events',
      prompt: text('A ticket desk types visitor names in a hurry. Write `clean_name(raw)` that returns the name tidied for a badge: no spaces at the ends, any run of spaces inside collapsed to **one** space, and every word capitalised (first letter upper case, the rest lower case). A word with hyphens capitalises each part, so `"anne-marie"` becomes `"Anne-Marie"`. Blank text gives an empty string.'),
      expectedBehavior: 'clean_name("  ada   LOVELACE ") is "Ada Lovelace"; hyphenated parts are capitalised separately.',
      guidedSteps: ['Split the text into words with `raw.split()`.', 'For each word, split on `"-"`, capitalise each part, and join the parts with `"-"`.', 'Join the words with one space.'],
      starterCode: 'def clean_name(raw):\n    pass\n',
      hints: ['Which method turns any amount of whitespace into clean word boundaries?', 'A word with a hyphen is two words for capitalising purposes: split, transform, rejoin.', '`str.capitalize()` lowers the rest of the word, which is what you want for "LOVELACE".'],
      checks: [
        ...calls('clean_name', [[['  ada   LOVELACE '], 'Ada Lovelace'], [['anne-marie smith'], 'Anne-Marie Smith'], [[''], '']], 3),
        ...refCalls('clean_name', NAME_REF, ['"   "', '"mcDONALD"', '"o\'neil"', '"JEAN--PAUL"', '"x"', '"a\\tb"', '"-x-"']),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'py-29-slugify', objectiveId: 'py-obj-normalise-text', title: 'Web Addresses from Titles', mode: 'challenge', language: 'python', skillIds: ['py.text', 'py.strings'], concepts: ['split', 'join', 'isalnum-trap'], difficulty: 3, context: 'marketing',
      prompt: text('A marketing team turns article titles into web addresses. Write `slugify(title)`: lower case; the characters `a` to `z` and `0` to `9` are kept; **every run of any other characters** (spaces, punctuation, accents, symbols) becomes a single `-`; and there is no `-` at the start or the end. `"Hello, World!"` gives `"hello-world"`. Text with nothing usable gives `""`.'),
      expectedBehavior: 'A lower-case, dash-separated slug with no leading, trailing or doubled dashes.',
      starterCode: '',
      hints: ['Think of the text as good characters and everything else as separators; what should happen at each?', 'Building the result character by character with a "current chunk" handles runs naturally.', 'Does the letter `é` count as one of `a` to `z`? Check what `isalpha` and `isalnum` say about it.'],
      checks: refCalls('slugify', SLUG_REF, ['"Hello, World!"', '"  Many   spaces  "', '"---"', '""', '"Already-a-slug"', '"Version 2.0 (final)"', '"Crème brûlée"', '"A&B"', '"x"', '"snake_case_name"', '"_lead_"', '"Ça va? Oui!"', '"100% Pure"']),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'py-29-tidy-code', objectiveId: 'py-obj-normalise-text', title: 'Tidy Part Codes', mode: 'challenge', language: 'python', skillIds: ['py.text', 'py.strings'], concepts: ['split', 'join', 'isalnum-trap'], difficulty: 3, context: 'manufacturing',
      prompt: text('Part codes reach the stockroom typed every which way, such as `" ab-12 / x9 "` or `"ab_12--X9"`. Write `tidy_code(text)` returning the code in upper case where the chunks are joined by single dashes: **spaces, dashes, slashes and underscores separate chunks**; the letters `A`–`Z` and digits `0`–`9` are kept; **every other character is simply dropped** (it does not separate anything), so `"ab.c-12"` gives `"ABC-12"`. No dashes at the start or end. Nothing usable gives `""`.'),
      expectedBehavior: 'Upper-case chunks joined with single dashes; other characters vanish.',
      starterCode: '',
      hints: ['Two kinds of unusual characters are treated differently here: which separate, and which are dropped?', 'Keep a current chunk; add good characters, flush the chunk on a separator, ignore the rest.', 'Accented letters are not `A`–`Z`. What do the string methods say about them?'],
      checks: refCalls('tidy_code', CODE_REF, ['" ab-12 / x9 "', '"ab_12--X9"', '"ab.c-12"', '""', '"///"', '"a"', '"É-ab"', '"x  y   z"', '"__q__"', '"12/34\\t56"', '"#a#b#"', '"a-b_c d/e"']),
      xpReward: 100, coinReward: 15,
    },
  ],
};
