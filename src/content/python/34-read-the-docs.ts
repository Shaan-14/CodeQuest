import { calls, text } from '../helpers';
import { refCalls } from '../daily/helpers';
import type { LessonBundle } from '../schema';

const TOP_WORDS_REF = "import re\nfrom collections import Counter\ndef _ref(t, n):\n    words = re.findall(r'[a-z]+', t.lower())\n    return sorted(Counter(words).items(), key=lambda p: (-p[1], p[0]))[:max(n, 0)]";
const RUNS_REF = "def _ref(v):\n    out = []\n    for x in v:\n        if out and out[-1][0] == x:\n            out[-1] = (x, out[-1][1] + 1)\n        else:\n            out.append((x, 1))\n    return out";
const COMPRESS_REF = "def _ref(lines):\n    out = []\n    i = 0\n    while i < len(lines):\n        j = i\n        while j < len(lines) and lines[j] == lines[i]:\n            j += 1\n        n = j - i\n        out.append(lines[i] if n == 1 else '%s (x%d)' % (lines[i], n))\n        i = j\n    return out";

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-34-read-the-docs', title: 'Learn a Tool from Its Documentation', language: 'python', skillId: 'ps.research',
    blurb: 'Nobody memorises a whole language. Learn to find a tool, read what it promises, test it on tiny cases, and know when it is the wrong one.', prerequisites: ['py-22-libraries'], xpReward: 80,
    reference: {
      title: 'Learning from documentation',
      body: text(
        'Reading documentation is a skill with a routine: **(1) state what you need** in a sentence with no tool names; **(2) search** with the words a documentation author would use (`consecutive`, `most common`, `sorted position`); **(3) read the signature, the one-line summary and the details** (they hold the edge cases); **(4) run the example and then a tiny experiment of your own**, including the empty input and a repeat; **(5) only then** use it in your solution, and test the solution the same way.',
        'Watch for the **sentence that limits the tool**: "only groups *consecutive* items", "the list must already be sorted", "returns a new list". These are exactly where wrong answers come from. When two tools look alike (`bisect_left` and `bisect_right`), find the sentence that separates them and test the one case that differs.',
        'Documentation can also tell you the tool is **not** what you need. Deciding not to use a library is a valid result of research. The Field Manual (Library → Field Manual) is your practice documentation: opening entries while you work is recorded as research, and it is never penalised.',
      ),
      example: 'from itertools import groupby\nruns = [(k, len(list(g))) for k, g in groupby([3, 3, 1, 3])]\nprint(runs)   # [(3, 2), (1, 1), (3, 1)]',
    },
    steps: [
      { kind: 'teach', title: 'You will never know it all', body: text('Professionals look things up constantly; what sets them apart is **how** they do it. They describe the problem in plain words, find the tool, read what it *promises*, and test it before trusting it. In this lesson the first problem names its tool so you can practise the routine. Then the problems stop naming anything.') },
      {
        kind: 'demo', title: 'Test a tool on a tiny case first', language: 'python',
        body: text('`groupby` looks like "group by key", but the documentation says it groups only **consecutive** items. One tiny experiment shows what that means.'),
        code: "from itertools import groupby\n\nprint([(k, len(list(g))) for k, g in groupby([1, 1, 2, 1])])\nprint([(k, len(list(g))) for k, g in groupby(sorted([1, 1, 2, 1]))])",
        notice: 'Unsorted, the `1`s appear as two separate runs; sorted first, they merge into one group of three. Neither is "wrong": you must pick the one that matches the question. An experiment on four numbers answered what a paragraph of reading might not.',
      },
      { kind: 'challenge', challengeId: 'py-34-top-words' },
      { kind: 'challenge', challengeId: 'py-34-run-lengths' },
    ],
  },
  objectives: [
    { id: 'py-obj-runs', title: 'Find and use the right tool for consecutive runs', summary: 'Work out from the documentation how to collapse consecutive equal items, without being told which tool to use.' },
  ],
  challenges: [
    {
      id: 'py-34-top-words', title: 'The Most Used Words', mode: 'learning', language: 'python', skillIds: ['ps.research', 'py.dicts'], concepts: ['collections.Counter', 'most_common', 'regex-findall'], difficulty: 3, context: 'publishing',
      prompt: text('An editor wants to see which words an article leans on. Write `top_words(text, n)` returning a list of `(word, count)` tuples for the `n` most common words, most common first, ties in alphabetical order. A **word** is a run of the letters `a` to `z`, ignoring upper/lower case (`"Don\'t"` is the two words `don` and `t`). `n` of zero or less gives `[]`; asking for more words than exist gives them all.', 'Look at `collections.Counter` in the Field Manual (Library), and check what `most_common` does with ties before you trust it.'),
      expectedBehavior: 'The n most common lower-case words with their counts, ties alphabetical.',
      guidedSteps: ['Find the words: lower-case the text and pull out each run of letters (the Field Manual has `re.findall`).', 'Count them with `Counter`.', 'Sort the `(word, count)` pairs by count descending, then word ascending; take the first `n`.'],
      starterCode: 'import re\nfrom collections import Counter\n\ndef top_words(text, n):\n    pass\n',
      hints: ['Two jobs: cut the text into words, then count them. Which tool does each?', 'Read what `most_common` says about equal counts: is that the order the editor wants?', 'A sort key can be a tuple; a negative count reverses the count ordering.'],
      checks: [
        ...calls('top_words', [[['the cat and the hat and the bat', 2], [['the', 3], ['and', 2]]], [['A a B', 5], [['a', 2], ['b', 1]]]], 2),
        ...refCalls('top_words', TOP_WORDS_REF, ['"the cat and the hat and the bat", 3', '"", 3', '"one two three", 2', '"Don\'t stop, don\'t!", 3', '"b a c a b c", 3', '"x y", 0', '"x y", -1', '"Hello, HELLO; hello world", 1', '"a1b2c3", 5']),
      ],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-34-run-lengths', objectiveId: 'py-obj-runs', title: 'Stretches of the Same Reading', mode: 'independent', language: 'python', skillIds: ['ps.research', 'py.lists'], concepts: [], difficulty: 3, transfer: true, context: 'science',
      prompt: text('A sensor records a status code every second. Write `run_lengths(values)` returning a list of `(value, length)` tuples, one for each **stretch of identical consecutive readings**, in order. `[3, 3, 3, 1, 3]` gives `[(3, 3), (1, 1), (3, 1)]`: the two separate stretches of `3` are not merged. An empty list gives `[]`.'),
      starterCode: '', hints: [],
      checks: refCalls('run_lengths', RUNS_REF, ['[]', '[5]', '[3, 3, 3, 1, 3]', '[1, 1, 2, 2, 2, 1, 1, 1]', '["a", "a", "b"]', '[0, 0, 0, 0]', '[1, 2, 3]', '[None, None, 1, None]', '[7, 7, 8, 8, 7, 7]']),
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'py-34-compress-log', objectiveId: 'py-obj-runs', title: 'Quieter Logs', mode: 'independent', language: 'python', skillIds: ['ps.research', 'py.lists'], concepts: [], difficulty: 3, transfer: true, context: 'operations',
      prompt: text('A log viewer should not show the same message dozens of times in a row. Write `compress_log(lines)` returning a list of strings in which every stretch of identical consecutive lines becomes that line once, followed by a space and `(x` the length of the stretch `)`: three identical lines `disk full` become `disk full (x3)`. A line that is alone in its stretch is left exactly as it is. Identical lines that are **not** next to each other are not merged. An empty list gives `[]`.'),
      starterCode: '', hints: [],
      checks: refCalls('compress_log', COMPRESS_REF, ['[]', '["a"]', '["disk full", "disk full", "disk full"]', '["a", "b", "b", "a", "a", "a", "c"]', '["x", "x"]', '["x", "y", "x"]', '["", "", ""]', '["a (x2)", "a (x2)"]']),
      xpReward: 110, coinReward: 16,
    },
  ],
};
