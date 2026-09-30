import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const AXIS = 'import math\ndef _ref(values):\n    top = max(values) if values else 0\n    return (0, max(10, math.ceil(top / 10) * 10))';
const BAR = "def _ref(spec):\n    found = []\n    if not spec.get('title', '').strip():\n        found.append('no-title')\n    if spec['type'] != 'pie' and not spec.get('y_label', '').strip():\n        found.append('no-units')\n    if spec['type'] == 'bar' and spec.get('y_min', 0) != 0:\n        found.append('truncated-axis')\n    if spec['type'] == 'pie' and spec.get('slices', 0) > 5:\n        found.append('too-many-slices')\n    return sorted(found)";
const LINE = "def _ref(spec):\n    found = []\n    if not spec.get('title', '').strip():\n        found.append('no-title')\n    if not spec.get('y_label', '').strip():\n        found.append('no-units')\n    if not spec.get('x_label', '').strip():\n        found.append('no-x-label')\n    if spec.get('points', 0) < 3:\n        found.append('too-few-points')\n    if spec.get('trendline') and spec.get('points', 0) < 10:\n        found.append('trendline-on-few-points')\n    if spec.get('dual_axis'):\n        found.append('dual-axis-misleads')\n    return sorted(found)";

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-04-charts', title: 'Honest Charts', language: 'python', skillId: 'stat.visualization',
    blurb: 'A chart is a claim. Learn the axis, labelling and type rules that keep a chart honest, and check a chart specification in code.', prerequisites: ['st-03-distributions'], xpReward: 55,
    reference: {
      title: 'Charts that tell the truth',
      body: text(
        'Match the chart to the question: **line** for change over time, **bar** to compare categories, **histogram** for a distribution, **scatter** for a relationship between two measurements, **pie** only for a few parts of a whole.',
        'Rules that keep a chart honest: a **bar chart axis starts at zero** (bar length carries the meaning); every chart has a **title and labelled axes with units**; avoid **dual axes** and trendlines drawn through very few points; do not let colour or scale exaggerate a small difference.',
      ),
      example: 'spec = {"type": "bar", "title": "Units sold", "y_label": "units", "y_min": 0}\nproblems = []\nif spec["type"] == "bar" and spec["y_min"] != 0:\n    problems.append("truncated-axis")\nprint(problems)',
    },
    steps: [
      { kind: 'teach', title: 'Charts make claims', body: text('A bar chart whose axis starts at 95 makes a 2% difference look like a 10-fold one. A pie chart with twelve slices is unreadable. A trendline through four points promises a pattern that four points cannot support. None of these are calculation errors; they are **design** errors that change what a reader believes.', 'Because charts are built from data, many of these mistakes can be caught by code. A dashboard pipeline can refuse to publish a chart whose specification breaks the rules.') },
      {
        kind: 'demo', title: 'Same data, two axes', language: 'python',
        body: text('Two axes for the same sales numbers. Run it and read the lengths of the bars as text.'),
        code: 'sales = {"Mon": 96, "Tue": 98, "Wed": 97}\nfor start in (0, 95):\n    print("axis from", start)\n    for day, v in sales.items():\n        print(" ", day, "#" * (v - start))',
        notice: 'From zero the bars look almost the same, which is the truth (98 vs 96). From 95 the Tuesday bar is three times Monday’s. Same data, very different impression.',
      },
      { kind: 'challenge', challengeId: 'st-04-axis' },
      { kind: 'challenge', challengeId: 'st-04-bar-problems' },
      { kind: 'challenge', challengeId: 'st-04-line-problems' },
    ],
  },
  objectives: [
    { id: 'st-obj-chart-review', title: 'Reviewing a chart specification', summary: 'Decide from a chart’s design whether it misleads, and say why, using rules.' },
  ],
  challenges: [
    {
      id: 'st-04-axis', title: 'Axis for a Bar Chart', mode: 'learning', language: 'python', skillIds: ['stat.visualization', 'py.functions'], concepts: ['bar chart axis', 'ceil'], difficulty: 2, context: 'business',
      prompt: text('A bar chart library needs the vertical axis limits. Write `bar_axis(values)` returning a tuple `(low, high)`: `low` is always **0** (bar lengths must be honest) and `high` is the **smallest multiple of 10 that is at least the largest value**, but never less than 10. An empty list gives `(0, 10)`.'),
      expectedBehavior: '(0, next multiple of 10 at or above the max), at least (0, 10).',
      guidedSteps: ['Find the maximum (what if the list is empty?).', 'Divide by 10 and round up with `math.ceil`, then multiply by 10.', 'Take the larger of that and 10.'],
      starterCode: 'def bar_axis(values):\n    pass\n',
      hints: ['Why must the lower limit never depend on the data?', 'Rounding up to a multiple is ceil(x / step) * step.', 'A maximum of exactly 40 needs an axis that reaches 40, not 50.'],
      checks: statCalls('bar_axis', AXIS, ['[12, 37, 25]', '[40]', '[]', '[0]', '[3, 7]', '[10, 10.5]', '[99, 100, 101]'], 3),
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'st-04-bar-problems', objectiveId: 'st-obj-chart-review', title: 'The Chart Checker', mode: 'challenge', language: 'python', skillIds: ['stat.visualization', 'py.dicts'], concepts: ['chart design rules'], difficulty: 3, context: 'business',
      prompt: text(
        'A reporting tool receives chart specs as dictionaries with `type` (`"bar"`, `"pie"` or `"line"`), `title`, `y_label`, `y_min` and, for pies, `slices`. Some keys may be missing. Write `review_chart(spec)` returning a **sorted list of problem names**:',
        '`"no-title"`: the title is missing or blank. `"no-units"`: any chart that is not a pie has a missing or blank `y_label`. `"truncated-axis"`: a **bar** chart whose `y_min` is not 0 (missing counts as 0). `"too-many-slices"`: a pie with **more than 5** slices. A good chart returns `[]`.',
      ),
      expectedBehavior: 'A sorted list of the rule names the spec breaks.',
      starterCode: 'def review_chart(spec):\n    pass\n',
      hints: ['Use spec.get so missing keys do not crash.', 'Each rule applies to some chart types only.', 'Collect names in a list and sort it at the end.'],
      checks: statCalls('review_chart', BAR, [
        "{'type': 'bar', 'title': 'Sales', 'y_label': 'units', 'y_min': 95}", "{'type': 'pie', 'title': 'Share', 'slices': 7}", "{'type': 'line', 'title': '', 'y_label': 'ms'}", "{'type': 'bar', 'title': 'Ok', 'y_label': 'kg', 'y_min': 0}",
        "{'type': 'bar', 'title': '   ', 'y_label': '  ', 'y_min': 10}", "{'type': 'pie', 'title': 'Five', 'slices': 5}", "{'type': 'pie', 'slices': 6}", "{'type': 'line', 'title': 'Trend', 'y_label': 'C', 'y_min': 15}", "{'type': 'bar', 'title': 'No min', 'y_label': 'n'}",
      ], 2),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'st-04-line-problems', objectiveId: 'st-obj-chart-review', title: 'The Dashboard Gate', mode: 'challenge', language: 'python', skillIds: ['stat.visualization', 'py.dicts'], concepts: ['chart design rules'], difficulty: 3, context: 'software',
      prompt: text(
        'A dashboard publishes trend charts only if they pass review. A spec is a dictionary with `title`, `x_label`, `y_label`, `points` (how many data points), `trendline` (true/false) and `dual_axis` (true/false); any key may be missing. Write `gate(spec)` returning a **sorted list of problem names**:',
        '`"no-title"`, `"no-x-label"` and `"no-units"` (missing or blank `title`, `x_label`, `y_label`); `"too-few-points"` when `points` is **under 3** (missing counts as 0); `"trendline-on-few-points"` when a trendline is drawn through **fewer than 10** points; `"dual-axis-misleads"` when `dual_axis` is true. A chart with no problems returns `[]`.',
      ),
      expectedBehavior: 'A sorted list of the rule names the spec breaks.',
      starterCode: 'def gate(spec):\n    pass\n',
      hints: ['Start from the pattern of the last checker.', 'Missing keys: choose the default the prompt states.', 'Two rules involve the number of points; they can both fire.'],
      checks: statCalls('gate', LINE, [
        "{'title': 'Latency', 'x_label': 'day', 'y_label': 'ms', 'points': 30}", "{'title': 'T', 'x_label': 'day', 'y_label': 'ms', 'points': 4, 'trendline': True}", "{}", "{'title': 'T', 'x_label': 'x', 'y_label': 'y', 'points': 12, 'trendline': True, 'dual_axis': True}",
        "{'title': ' ', 'x_label': 'x', 'y_label': 'y', 'points': 2}", "{'title': 'T', 'x_label': 'x', 'y_label': 'y', 'points': 10, 'trendline': True}", "{'title': 'T', 'x_label': '', 'y_label': 'y', 'points': 3, 'trendline': False}", "{'title': 'T', 'x_label': 'x', 'y_label': 'y', 'points': 9, 'trendline': True}",
      ], 2),
      xpReward: 75, coinReward: 11,
    },
  ],
};
