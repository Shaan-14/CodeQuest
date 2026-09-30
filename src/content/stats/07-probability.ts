import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const EV = 'def _ref(outcomes):\n    if abs(sum(p for _, p in outcomes) - 1) > 1e-9:\n        raise ValueError("probabilities must sum to 1")\n    return round(sum(v * p for v, p in outcomes), 4)';
const ATLEAST = 'def _ref(p, n):\n    return round(1 - (1 - p) ** n, 4)';

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-07-probability', title: 'Probability and Expected Value', language: 'python', skillId: 'stat.probability',
    blurb: 'Work out chances exactly, weigh outcomes by how likely they are, and check your reasoning with a simulation.', prerequisites: ['st-01-describing'], xpReward: 65,
    reference: {
      title: 'Chance in code',
      body: text(
        'A **probability** is between 0 and 1. For **independent** events multiply: two fair dice both showing 6 is 1/6 × 1/6. “**At least one**” is easiest as `1 − P(none)`: if each of `n` trials fails with probability `1 − p`, the chance of at least one success is `1 − (1 − p)^n`.',
        'The **expected value** is the average outcome if you could repeat forever: `Σ value × probability`, where the probabilities must sum to 1. A **simulation** estimates a probability by running the experiment many times (seed the generator so runs are repeatable) and checking it agrees with the exact answer, which is how you test your own reasoning.',
      ),
      example: 'import random\nrng = random.Random(1)\ntrials = 20000\nhits = sum(1 for _ in range(trials) if rng.randint(1, 6) == 6 and rng.randint(1, 6) == 6)\nprint(hits / trials, 1 / 36)',
    },
    steps: [
      { kind: 'teach', title: 'Weighing outcomes', body: text('A lottery ticket costs 2, pays 100 with probability 0.01 and nothing otherwise. Its expected value is 0.01 × 100 + 0.99 × 0 = 1: on average you lose 1 per ticket. Expected value turns a risky choice into one comparable number. It is **not** what happens in any single play.', 'For “at least one” questions, do not add probabilities (they can exceed 1). Compute the chance that **none** happens and subtract from 1.') },
      {
        kind: 'demo', title: 'Reasoning versus simulation', language: 'python',
        body: text('The chance of rolling at least one 6 in four throws, worked out and simulated.'),
        code: 'import random\nexact = 1 - (5 / 6) ** 4\nrng = random.Random(3)\ntrials = 20000\nhits = sum(1 for _ in range(trials) if any(rng.randint(1, 6) == 6 for _ in range(4)))\nprint("exact    ", round(exact, 4))\nprint("simulated", round(hits / trials, 4))',
        notice: 'The two answers agree to about two decimals. When they do not, one of them is wrong: simulation is a way to test reasoning.',
      },
      { kind: 'challenge', challengeId: 'st-07-expected' },
      { kind: 'challenge', challengeId: 'st-07-at-least' },
      { kind: 'challenge', challengeId: 'st-07-at-least-b' },
      { kind: 'challenge', challengeId: 'st-07-simulate' },
      { kind: 'challenge', challengeId: 'st-07-simulate-b' },
    ],
  },
  objectives: [
    { id: 'st-obj-at-least', title: 'The chance of at least one', summary: 'Use the complement to find the chance that an event happens at least once.' },
    { id: 'st-obj-simulate', title: 'Estimating chance by simulation', summary: 'Write a seeded simulation and check it against the exact answer.' },
  ],
  challenges: [
    {
      id: 'st-07-expected', title: 'Is the Game Fair?', mode: 'learning', language: 'python', skillIds: ['stat.probability', 'py.lists'], concepts: ['expected value'], difficulty: 2, context: 'games',
      prompt: text('A game lists its outcomes as `(value, probability)` pairs. Write `expected_value(outcomes)` returning `Σ value × probability` **rounded to 4 decimal places**. If the probabilities do not add up to 1 (allow a tiny rounding tolerance of `1e-9`), raise a `ValueError`.'),
      expectedBehavior: 'The probability-weighted average rounded to 4 places; ValueError when probabilities do not sum to 1.',
      guidedSteps: ['Multiply each value by its probability and add them up.', 'Check the probabilities sum to 1 first.', 'Raise `ValueError("probabilities must sum to 1")` otherwise.'],
      starterCode: 'def expected_value(outcomes):\n    pass\n',
      hints: ['Each outcome contributes value × probability.', 'A comparison of floats needs a tolerance, not ==.', 'Raising an error is how a function refuses bad input.'],
      checks: [
        ...statCalls('expected_value', EV, ['[(100, 0.01), (0, 0.99)]', '[(1, 0.5), (2, 0.5)]', '[(-2, 0.25), (0, 0.5), (4, 0.25)]', '[(10, 1.0)]', '[(3, 0.1), (5, 0.2), (7, 0.7)]', '[(1, 1/3), (2, 1/3), (3, 1/3)]', '[(3, 0.7), (2, 0.2), (1, 0.1)]', '[(i, 0.1) for i in range(10)]'], 3),
        { kind: 'script', name: 'Rounded to 4 places', visible: false, code: 'assert expected_value([(1, 1/3), (2, 2/3)]) == 1.6667, "Round the answer to exactly 4 decimal places."' },
        { kind: 'script', name: 'Probabilities that do not add up are refused', visible: false, code: 'try:\n    expected_value([(1, 0.5), (2, 0.6)])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("Probabilities summing to 1.1 should raise a ValueError.")\ntry:\n    expected_value([(1, 0.2)])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("Probabilities summing to 0.2 should raise a ValueError.")' },
      ],
      xpReward: 45, coinReward: 7,
    },
    {
      id: 'st-07-at-least', objectiveId: 'st-obj-at-least', title: 'A Defect in the Batch', mode: 'challenge', language: 'python', skillIds: ['stat.probability', 'py.functions'], concepts: ['complement', 'independent events'], difficulty: 3, context: 'manufacturing',
      prompt: text('Each item in a batch is independently defective with probability `p`. Write `batch_has_defect(p, n)` returning the probability that a batch of `n` items contains **at least one** defective item, **rounded to 4 decimal places**. A batch of zero items has no defects (return `0.0`).'),
      expectedBehavior: '1 − (1 − p)^n rounded to 4 places.',
      starterCode: 'def batch_has_defect(p, n):\n    pass\n',
      hints: ['Adding n copies of p overshoots: it can exceed 1.', 'What is the chance that NONE are defective?', 'Then the answer is what is left.'],
      checks: statCalls('batch_has_defect', ATLEAST, ['0.05, 10', '0.5, 3', '0.01, 100', '0, 50', '1, 5', '0.2, 0', '0.001, 1000', '0.3, 1'], 2),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'st-07-at-least-b', objectiveId: 'st-obj-at-least', title: 'Any Outage This Month', mode: 'challenge', language: 'python', skillIds: ['stat.probability', 'py.functions'], concepts: ['complement', 'independent events'], difficulty: 3, context: 'software',
      prompt: text('A service has an independent chance `p` of an outage on each day. Write `any_outage(p, days)` returning the probability of **at least one outage** over the given number of days, **rounded to 4 decimal places**. With 0 days the answer is `0.0`.'),
      expectedBehavior: '1 − (1 − p)^days rounded to 4 places.',
      starterCode: 'def any_outage(p, days):\n    pass\n',
      hints: ['Same shape of problem as any “at least one”.', 'Think about the one way it does NOT happen.', 'Multiplying the no-outage chance day after day is a power.'],
      checks: statCalls('any_outage', ATLEAST, ['0.01, 30', '0.1, 7', '0.5, 2', '0, 100', '1, 3', '0.02, 0', '0.001, 365', '0.25, 1'], 2),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'st-07-simulate', objectiveId: 'st-obj-simulate', title: 'Double Six by Simulation', mode: 'challenge', language: 'python', skillIds: ['stat.probability', 'py.loops', 'py.modules'], concepts: ['simulation', 'seed'], difficulty: 3, context: 'games',
      prompt: text('Write `estimate_double_six(trials, seed)` that simulates rolling **two fair six-sided dice** `trials` times using `random.Random(seed)` and returns the **fraction of trials in which both dice showed 6**. The same seed must give the same answer. With `trials` of 0 return `0.0`.'),
      expectedBehavior: 'A reproducible estimate close to 1/36.',
      starterCode: 'def estimate_double_six(trials, seed):\n    pass\n',
      hints: ['One generator, created once, drives every roll.', 'Count the successes, then divide by the number of trials.', 'Both dice must be six in the same trial.'],
      checks: [
        { kind: 'script', name: 'Close to the true chance', visible: true, code: 'p = estimate_double_six(60000, 1)\nassert 0.022 < p < 0.0335, "Your estimate %r is far from what two fair dice give. Re-check the experiment." % p' },
        { kind: 'script', name: 'Reproducible', visible: false, code: 'assert estimate_double_six(5000, 9) == estimate_double_six(5000, 9), "The same seed must give the same estimate."\nassert isinstance(estimate_double_six(10, 1), float), "Return a fraction as a float."' },
        { kind: 'script', name: 'Other seeds and sizes', visible: false, code: 'for seed in (2, 3):\n    p = estimate_double_six(60000, seed)\n    assert 0.022 < p < 0.0335, "Another seed gave %r." % p\nassert estimate_double_six(0, 1) == 0.0, "No trials gives 0.0."\nassert 0 <= estimate_double_six(1, 4) <= 1' },
      ],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'st-07-simulate-b', objectiveId: 'st-obj-simulate', title: 'Two Defects in a Batch', mode: 'challenge', language: 'python', skillIds: ['stat.probability', 'py.loops', 'py.modules'], concepts: ['simulation', 'seed'], difficulty: 3, context: 'manufacturing',
      prompt: text('A batch has **10 items**, each independently defective with probability **0.05**. Write `estimate_two_defects(trials, seed)` that simulates `trials` batches using `random.Random(seed)` and returns the **fraction of batches with two or more defective items**. The same seed must give the same answer; 0 trials gives `0.0`.'),
      expectedBehavior: 'A reproducible estimate close to 0.0861.',
      starterCode: 'def estimate_two_defects(trials, seed):\n    pass\n',
      hints: ['A trial is a whole batch of ten checks.', 'Count defects within a batch before deciding whether the batch qualifies.', '“Two or more” is not the same as “exactly two” or “at least one”.'],
      checks: [
        { kind: 'script', name: 'Close to the true chance', visible: true, code: 'p = estimate_two_defects(60000, 1)\nassert 0.076 < p < 0.096, "Your estimate %r is far from what the batch model gives. Re-check the experiment." % p' },
        { kind: 'script', name: 'Reproducible', visible: false, code: 'assert estimate_two_defects(5000, 9) == estimate_two_defects(5000, 9), "The same seed must give the same estimate."\nassert isinstance(estimate_two_defects(10, 1), float), "Return a fraction as a float."' },
        { kind: 'script', name: 'Other seeds and sizes', visible: false, code: 'for seed in (2, 3):\n    p = estimate_two_defects(60000, seed)\n    assert 0.076 < p < 0.096, "Another seed gave %r." % p\nassert estimate_two_defects(0, 1) == 0.0, "No trials gives 0.0."' },
      ],
      xpReward: 85, coinReward: 12,
    },
  ],
};
