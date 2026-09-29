import { calls, text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-23-testing', title: 'Proving It Works', language: 'python', skillId: 'test.assertions',
    blurb: 'Assertions, writing tests that catch bugs, and separating logic from input and output.', prerequisites: ['py-22-libraries'], xpReward: 55,
    reference: {
      title: 'Testing',
      body: text(
        '`assert condition, "message"` does nothing if the condition is True and raises `AssertionError` if it is False. A **test** is a function whose name starts with `test_` and which calls your code and asserts what should come back: `def test_double(): assert double(4) == 8`.',
        'Good tests cover the **normal** case, the **boundaries** (exactly at a limit, one either side), and the **edges** (empty, zero, negative, one item). A test suite that only checks the easy case passes even when the code is wrong.',
        '**Separate logic from input/output.** A function that computes and *returns* is easy to test. A function that reads `input()` and `print`s cannot be tested without a person. Put the thinking in functions and keep the reading/printing thin.',
      ),
      example: 'def test_low():\n    assert letter_grade(50) == "F"\n\ndef test_boundary():\n    assert letter_grade(90) == "A"\n    assert letter_grade(89) == "B"',
    },
    steps: [
      {
        kind: 'teach', title: 'Tests are how you know',
        body: text(
          'How do you know your function works? Running it once and seeing a sensible answer is not enough: bugs hide at the **edges**. Professional programmers write **automated tests**: small functions that run their code on chosen inputs and check the answers, so any change that breaks something is caught immediately.',
          'Writing a good test is a skill of its own. It means asking: *what could go wrong here?* You will practise it by writing tests and being judged on whether they can **catch deliberately broken versions** of the code.',
        ),
      },
      {
        kind: 'demo', title: 'A test that passes, and one that fails', expectsError: true,
        body: text('`assert` is silent when things are right and loud when they are wrong. The second assertion has a message.'),
        code: 'def double(x):\n    return x * 2\n\nassert double(4) == 8\nprint("first check passed")\nassert double(-3) == 6, "double(-3) should be -6, not 6"\nprint("never reached")',
        notice: 'The first assertion passed silently. The second raised an `AssertionError` showing our message, and the program stopped there. Notice that the bug was in my TEST this time (I wrote the wrong expected value). Tests can be wrong too.',
      },
      {
        kind: 'teach', title: 'Test the edges',
        body: text(
          'Imagine a function `letter_grade(score)` that returns “A” for 90 and above. A lazy test checks `letter_grade(95) == "A"` and stops. But the likely bug is at the boundary: does 90 itself get an A? Does 89 get a B? **Test the values on either side of every threshold.**',
          'In this lesson you write tests, and the game checks them against a **correct** version (all your tests must pass) and several **buggy** versions (each must be caught by at least one of your tests).',
        ),
      },
      { kind: 'challenge', challengeId: 'py-23-first-tests' },
      { kind: 'challenge', challengeId: 'py-23-test-grade' },
      { kind: 'challenge', challengeId: 'py-23-bmi' },
    ],
  },
  objectives: [
    { id: 'py-obj-write-tests', title: 'Write tests that catch bugs', summary: 'Design test cases (boundaries and edges) that fail on broken implementations and pass on a correct one.' },
    { id: 'py-obj-separate-io', title: 'Separate logic from input and output', summary: 'Refactor a program so the calculation lives in testable functions and input/output stays thin.' },
  ],
  challenges: [
    {
      id: 'py-23-first-tests', title: 'Your First Tests', mode: 'learning', language: 'python', skillIds: ['test.assertions', 'test.writing'], concepts: ['assert', 'test function', 'edge cases'], difficulty: 2, context: 'general',
      prompt: text('The game has a function `is_even(n)` that should return `True` for even whole numbers and `False` for odd ones. You cannot see its code. Write **test functions** (names starting with `test_`) that use `assert` to check it.', 'Your tests must all **pass on the correct version** and must **catch every broken version**. Think about what a lazy implementation would get wrong: negative numbers? zero?'),
      expectedBehavior: 'At least two test_ functions that pass on the correct is_even and fail on each buggy one.',
      guidedSteps: ['Write `def test_even():` and assert `is_even(4) is True`.', 'Write a test for an odd number.', 'Add tests for 0 and for a negative number.', 'Press Submit: the game runs your tests against several versions.'],
      starterCode: 'def test_even():\n    assert is_even(4) is True\n',
      hints: ['One test is not enough to catch every mistake. Think about DIFFERENT kinds of input.', 'Cover: an even number, an odd number, zero, and a negative number (even and odd).', '`assert is_even(0) is True`, `assert is_even(-3) is False`, `assert is_even(-4) is True`, `assert is_even(7) is False`.'],
      checks: [{
        kind: 'tests', name: 'Your tests pass on correct code and catch the bugs', minTests: 2,
        correct: 'def is_even(n):\n    return n % 2 == 0',
        buggy: [
          { name: 'it reports odd numbers as even', code: 'def is_even(n):\n    return n % 2 == 1' },
          { name: 'it forgets that zero is even', code: 'def is_even(n):\n    return n > 0 and n % 2 == 0' },
          { name: 'it mishandles negative numbers', code: 'def is_even(n):\n    return n >= 0 and n % 2 == 0 or n < 0 and n % 2 == 1' },
          { name: 'it thinks only multiples of 4 are even', code: 'def is_even(n):\n    return n % 4 == 0' },
        ],
      }],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-23-test-grade', objectiveId: 'py-obj-write-tests', title: 'Test the Grader', mode: 'challenge', language: 'python', skillIds: ['test.writing', 'test.assertions'], concepts: ['assert', 'boundary values', 'edge cases', 'test design'], difficulty: 3, context: 'education',
      prompt: text('A school’s `letter_grade(score)` returns `"A"` for 90 and above, `"B"` for 80 to 89, `"C"` for 70 to 79, and `"D"` for anything below 70. You cannot see the code. Write tests (functions named `test_...`) that pass on the correct version and **catch every buggy version** the game has prepared.', 'The bugs are the kind real programmers make. Think about where they usually hide.'),
      expectedBehavior: 'Your tests pass on the correct letter_grade and fail on each broken one.',
      starterCode: '',
      hints: ['Bugs hide at the boundaries between grades.', 'For each threshold, test the value exactly on it AND the value just below it.', 'That means 90 and 89, 80 and 79, 70 and 69, plus a very low and a very high score. One `assert` per value is fine.'],
      checks: [{
        kind: 'tests', name: 'Your tests pass on correct code and catch every bug', minTests: 3, visible: false,
        correct: 'def letter_grade(score):\n    if score >= 90:\n        return "A"\n    if score >= 80:\n        return "B"\n    if score >= 70:\n        return "C"\n    return "D"',
        buggy: [
          { name: 'a bug at the A boundary', code: 'def letter_grade(score):\n    if score > 90:\n        return "A"\n    if score >= 80:\n        return "B"\n    if score >= 70:\n        return "C"\n    return "D"' },
          { name: 'a bug at the B boundary', code: 'def letter_grade(score):\n    if score >= 90:\n        return "A"\n    if score > 80:\n        return "B"\n    if score >= 70:\n        return "C"\n    return "D"' },
          { name: 'a bug at the C boundary', code: 'def letter_grade(score):\n    if score >= 90:\n        return "A"\n    if score >= 80:\n        return "B"\n    if score > 70:\n        return "C"\n    return "D"' },
          { name: 'a bug for very low scores', code: 'def letter_grade(score):\n    if score >= 90:\n        return "A"\n    if score >= 80:\n        return "B"\n    if score >= 70:\n        return "C"\n    if score >= 10:\n        return "D"\n    return "F"' },
          { name: 'a bug for a perfect score', code: 'def letter_grade(score):\n    if score == 100:\n        return "B"\n    if score >= 90:\n        return "A"\n    if score >= 80:\n        return "B"\n    if score >= 70:\n        return "C"\n    return "D"' },
        ],
      }],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'py-23-test-password', objectiveId: 'py-obj-write-tests', title: 'Test the Password Rule', mode: 'challenge', language: 'python', skillIds: ['test.writing', 'test.assertions'], concepts: ['assert', 'boundary values', 'edge cases', 'test design'], difficulty: 3, context: 'security',
      prompt: text('`is_strong(password)` returns `True` only when a password has **at least 8 characters**, **at least one digit**, and **at least one upper-case letter**. You cannot see the code. Write tests that pass on the correct version and **catch every buggy version**.', 'Think about each rule separately, and about lengths right at the limit.'),
      expectedBehavior: 'Your tests pass on the correct is_strong and fail on each broken one.',
      starterCode: '',
      hints: ['There are three rules. A bug may break just one of them.', 'For each rule, write a password that breaks ONLY that rule and assert the result is `False`.', 'Also test a password that satisfies everything (`True`), and lengths of exactly 7 and exactly 8.'],
      checks: [{
        kind: 'tests', name: 'Your tests pass on correct code and catch every bug', minTests: 3, visible: false,
        correct: 'def is_strong(password):\n    return len(password) >= 8 and any(c.isdigit() for c in password) and any(c.isupper() for c in password)',
        buggy: [
          { name: 'a bug in the length limit', code: 'def is_strong(password):\n    return len(password) > 8 and any(c.isdigit() for c in password) and any(c.isupper() for c in password)' },
          { name: 'a bug where the digit rule is missing', code: 'def is_strong(password):\n    return len(password) >= 8 and any(c.isupper() for c in password)' },
          { name: 'a bug where the upper-case rule is missing', code: 'def is_strong(password):\n    return len(password) >= 8 and any(c.isdigit() for c in password)' },
          { name: 'a bug where only one of the character rules is needed', code: 'def is_strong(password):\n    return len(password) >= 8 and (any(c.isdigit() for c in password) or any(c.isupper() for c in password))' },
          { name: 'a bug where the length limit is too low', code: 'def is_strong(password):\n    return len(password) >= 6 and any(c.isdigit() for c in password) and any(c.isupper() for c in password)' },
        ],
      }],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'py-23-bmi', objectiveId: 'py-obj-separate-io', title: 'Untangle the BMI Program', mode: 'challenge', language: 'python', skillIds: ['sd.functions', 'test.assertions', 'ps.decomposition'], concepts: ['separation of concerns', 'functions', 'return vs print', 'refactoring'], difficulty: 3, context: 'health',
      prompt: text(
        'This program reads a weight and a height, works out a body-mass index (BMI), and prints it with a category. It works, but everything is tangled together, so none of it can be tested without typing input.',
        '**Refactor it.** Create two functions: `bmi(weight_kg, height_m)` that **returns** the BMI (weight divided by height squared), and `category(value)` that **returns** `"Underweight"` (below 18.5), `"Normal"` (below 25), `"Overweight"` (below 30) or `"Obese"`. The program itself must still read the two lines and print the BMI to one decimal, a space, and the category, e.g. `22.9 Normal`.',
      ),
      expectedBehavior: 'bmi(70, 1.75) is about 22.86. category(24.9) is "Normal". With input 70 and 1.75 the program prints "22.9 Normal".',
      sampleInput: ['70', '1.75'],
      starterCode: 'w = float(input())\nh = float(input())\nvalue = w / (h * h)\nif value < 18.5:\n    label = "Underweight"\nelif value < 25:\n    label = "Normal"\nelif value < 30:\n    label = "Overweight"\nelse:\n    label = "Obese"\nprint(f"{value:.1f} {label}")\n',
      hints: ['Each function has one job and returns a value; only the main part reads and prints.', 'Move the arithmetic into `bmi` and the if/elif chain into `category`; each `return`s instead of printing.', 'The program then becomes: read two numbers, `value = bmi(w, h)`, `print(f"{value:.1f} {category(value)}")`.'],
      checks: [
        ...calls('bmi', [[[70, 1.75], 22.857142857142858], [[50, 2], 12.5]], 1, { stdin: ['70', '1.75'], approx: 1e-6 }),
        ...calls('category', [[[17], 'Underweight'], [[18.5], 'Normal'], [[24.9], 'Normal'], [[25], 'Overweight'], [[29.99], 'Overweight'], [[30], 'Obese']], 2, { stdin: ['70', '1.75'] }),
        { kind: 'output', name: 'The program still works', stdin: ['70', '1.75'], expect: '22.9 Normal' },
        { kind: 'output', name: 'Another person', stdin: ['50', '1.8'], expect: '15.4 Underweight', visible: false },
        { kind: 'output', name: 'Another person again', stdin: ['95', '1.7'], expect: '32.9 Obese', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the functions with def.' }],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'py-23-tip-split', objectiveId: 'py-obj-separate-io', title: 'Untangle the Bill Splitter', mode: 'challenge', language: 'python', skillIds: ['sd.functions', 'test.assertions', 'ps.decomposition'], concepts: ['separation of concerns', 'functions', 'return vs print', 'refactoring'], difficulty: 3, context: 'finance',
      prompt: text(
        'This program reads a bill, a tip percentage and a number of people, then prints what each person pays. It works, but the calculation is buried between the `input` and `print` lines, so it cannot be tested.',
        '**Refactor it.** Write `total_with_tip(bill, percent)` that **returns** the bill plus the tip, and `share(total, people)` that **returns** the total divided among the people. The program must still read the three lines and print `Each pays ` followed by the share to two decimals (e.g. `Each pays 14.85`).',
      ),
      expectedBehavior: 'total_with_tip(100, 10) is 110.0. share(110, 4) is 27.5. With input 54, 10, 4 the program prints "Each pays 14.85".',
      sampleInput: ['54', '10', '4'],
      starterCode: 'bill = float(input())\npercent = float(input())\npeople = int(input())\nprint(f"Each pays {bill * (1 + percent / 100) / people:.2f}")\n',
      hints: ['Two calculations, so two functions, and each RETURNS its result.', 'The program then reads three numbers and calls the functions.', '`total_with_tip`: `bill * (1 + percent / 100)`; `share`: `total / people`.'],
      checks: [
        ...calls('total_with_tip', [[[100, 10], 110], [[54, 10], 59.4], [[20, 0], 20]], 1, { stdin: ['54', '10', '4'], approx: 1e-9 }),
        ...calls('share', [[[110, 4], 27.5], [[59.4, 4], 14.85], [[10, 1], 10]], 1, { stdin: ['54', '10', '4'], approx: 1e-9 }),
        { kind: 'output', name: 'The program still works', stdin: ['54', '10', '4'], expect: 'Each pays 14.85' },
        { kind: 'output', name: 'A different bill', stdin: ['80', '25', '5'], expect: 'Each pays 20.00', visible: false },
        { kind: 'output', name: 'No tip, one person', stdin: ['12.5', '0', '1'], expect: 'Each pays 12.50', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the functions with def.' }],
      xpReward: 80, coinReward: 12,
    },
  ],
};
