import { calls, text } from '../helpers';
import { script } from '../daily/helpers';
import type { LessonBundle } from '../schema';

const PORT_REF = "def _ref(t):\n    t = t.strip()\n    if not t or any(c not in '0123456789' for c in t):\n        raise ValueError('invalid port')\n    n = int(t)\n    if not 1 <= n <= 65535:\n        raise ValueError('invalid port')\n    return n";

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-32-exceptions', title: 'Raising Your Own Errors', language: 'python', skillId: 'py.defensive',
    blurb: 'Errors are messages between parts of a program. Raise the right one, with the right meaning, and catch only what you can handle.', prerequisites: ['py-19-debugging'], xpReward: 70,
    reference: {
      title: 'Exceptions',
      body: text(
        '`raise ValueError("message")` stops the function and hands an error to the caller; `try: ... except ValueError as e: ...` catches it (`str(e)` is the message). Pick the built-in that describes the problem (`ValueError` for a bad value, `TypeError` for a wrong type, `KeyError`/`IndexError` for missing items) and write a message that says what was wrong.',
        'Define your own when the callers need to tell problems apart: `class InsufficientFunds(Exception): ...`. Put useful facts on it (`self.shortfall = ...`) by giving it an `__init__` that calls `super().__init__(message)`. Catch the **specific** class you can handle, in order from specific to general; never a bare `except:` that hides bugs.',
        '`try/except/else/finally`: `else` runs only when nothing was raised; `finally` always runs (closing files, releasing things). Read a **traceback from the bottom**: the last line says what went wrong; the lines above say where, innermost call last.',
      ),
      example: 'class OutOfStock(Exception):\n    def __init__(self, missing):\n        super().__init__(f"{missing} short")\n        self.missing = missing\n\ntry:\n    raise OutOfStock(3)\nexcept OutOfStock as e:\n    print(e.missing)',
    },
    steps: [
      { kind: 'teach', title: 'Errors as messages', body: text('When a function cannot do its job, returning a special value (`-1`, `None`) forces every caller to remember to check. **Raising an exception** cannot be ignored by accident, and its *type* tells the caller what kind of trouble it was. Two disciplines make this work: raise the **most specific, honest** error, and catch only what you know how to handle.') },
      {
        kind: 'demo', title: 'Raise, catch, and a custom error', language: 'python',
        body: text('`Low` is a custom exception. Notice which `except` clause runs for each call, and that `finally` always prints.'),
        code: "class Low(Exception):\n    def __init__(self, short):\n        super().__init__(f'{short} short')\n        self.short = short\n\ndef take(stock, n):\n    if n <= 0:\n        raise ValueError('n must be positive')\n    if n > stock:\n        raise Low(n - stock)\n    return stock - n\n\nfor n in (3, 9, 0):\n    try:\n        print('left:', take(5, n))\n    except Low as e:\n        print('not enough, short by', e.short)\n    except ValueError as e:\n        print('bad request:', e)\n    finally:\n        print('-- handled', n)",
        notice: 'Three requests, three outcomes: success, the custom `Low` (with its `short` fact) and a plain `ValueError`. The two `except` clauses are separate because the callers need to treat them differently.',
      },
      { kind: 'challenge', challengeId: 'py-32-parse-port' },
      { kind: 'challenge', challengeId: 'py-32-withdraw' },
    ],
  },
  objectives: [
    { id: 'py-obj-custom-exception', title: 'Design and raise a custom exception', summary: 'Define an exception class carrying a useful fact, raise it for the right condition, and keep other errors as their own type.' },
  ],
  challenges: [
    {
      id: 'py-32-parse-port', title: 'A Valid Port Number', mode: 'learning', language: 'python', skillIds: ['py.defensive', 'py.input'], concepts: ['raise', 'ValueError', 'validation'], difficulty: 3, context: 'networking',
      prompt: text('A configuration tool reads port numbers typed by people. Write `parse_port(text)` that returns the port as an `int`. The text may have spaces around it (ignore them). It is valid only if it is made **only of the digits 0 to 9** and the number is from **1 to 65535** inclusive. Otherwise `raise ValueError("invalid port")` with exactly that message.', 'Careful: `int()` is more forgiving than this rule (it accepts things like `"+80"` and `"8_0"`).'),
      expectedBehavior: 'Returns the port number, or raises ValueError("invalid port").',
      guidedSteps: ['Strip the spaces.', 'Check the text is non-empty and every character is one of `0123456789`.', 'Convert with `int` and check the range.', '`raise ValueError("invalid port")` for any failure.'],
      starterCode: 'def parse_port(text):\n    pass\n',
      hints: ['Which checks can you make before converting, and why is `int()` alone not a strict enough test?', 'Empty text, signs and underscores are all legal to `int` in some cases. What test rejects them up front?', 'One `raise` statement with the exact message can serve every failure path.'],
      checks: [
        ...calls('parse_port', [[['80'], 80], [[' 8080 '], 8080], [['65535'], 65535]], 3),
        script('Invalid text raises ValueError with the exact message', PORT_REF + "\nfor bad in ['', '  ', 'abc', '0', '65536', '-1', '+80', '8_0', '80.5', '1e3', '99999', '0x50']:\n    try:\n        r = parse_port(bad)\n    except ValueError as e:\n        assert str(e) == 'invalid port', 'The message for %r should be exactly invalid port, got %r.' % (bad, str(e))\n    else:\n        raise AssertionError('parse_port(%r) should raise ValueError but returned %r.' % (bad, r))", false),
        script('Boundaries and leading zeros', "assert parse_port('1') == 1 and parse_port('007') == 7 and parse_port('0080') == 80 and parse_port('\\t443\\n') == 443", false),
      ],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-32-withdraw', objectiveId: 'py-obj-custom-exception', title: 'A Withdrawal That Can Fail', mode: 'challenge', language: 'python', skillIds: ['py.defensive', 'sd.functions'], concepts: ['custom-exception', 'raise', 'attributes'], difficulty: 3, context: 'finance',
      prompt: text('A banking module needs its own error. Define `InsufficientFunds`, a kind of `Exception`, that carries an attribute `shortfall` (how much more money was needed). Then write `withdraw(balance, amount)` returning the new balance.', 'If `amount` is zero or negative, raise a plain `ValueError` (it is a bad request, **not** insufficient funds). If `amount` is more than `balance`, raise `InsufficientFunds` with `shortfall` set to `amount - balance`. Taking out exactly the whole balance is allowed.'),
      expectedBehavior: 'Returns balance - amount, or raises the right kind of error.',
      starterCode: '',
      hints: ['Two different problems need two different error types: which is which?', 'A custom exception can hold extra facts; where do you store them?', 'Test the boundary: what happens when the amount equals the balance?'],
      checks: [
        script('The exception class exists and behaves', "assert issubclass(InsufficientFunds, Exception), 'InsufficientFunds should be a kind of Exception.'\nassert not issubclass(InsufficientFunds, ValueError), 'Keep it distinct from ValueError, so callers can tell them apart.'\ne = InsufficientFunds(5) if InsufficientFunds.__init__ is not Exception.__init__ else None"),
        script('Successful withdrawals', "assert withdraw(100, 30) == 70\nassert withdraw(50, 50) == 0, 'Taking the whole balance is allowed.'\nassert withdraw(10.5, 0.5) == 10.0", false),
        script('Too much raises InsufficientFunds with the shortfall', "try:\n    withdraw(20, 35)\n    raise SystemExit('should have raised')\nexcept InsufficientFunds as e:\n    assert e.shortfall == 15, 'shortfall should be amount - balance (15), got %r.' % (getattr(e, 'shortfall', None),)\ntry:\n    withdraw(0, 1)\n    raise SystemExit('should have raised')\nexcept InsufficientFunds as e:\n    assert e.shortfall == 1", false),
        script('A bad amount is a ValueError, not InsufficientFunds', "for bad in (0, -5, -0.01):\n    try:\n        withdraw(100, bad)\n        raise SystemExit('should have raised for %r' % (bad,))\n    except InsufficientFunds:\n        raise AssertionError('A non-positive amount is a bad request (ValueError), not insufficient funds.')\n    except ValueError:\n        pass\ntry:\n    withdraw(0, 0)\n    raise SystemExit('should have raised')\nexcept InsufficientFunds:\n    raise AssertionError('Zero is a bad amount even when the balance is zero.')\nexcept ValueError:\n    pass", false),
      ],
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'py-32-reserve', objectiveId: 'py-obj-custom-exception', title: 'A Reservation That Can Fail', mode: 'challenge', language: 'python', skillIds: ['py.defensive', 'sd.functions'], concepts: ['custom-exception', 'raise', 'attributes'], difficulty: 3, context: 'retail',
      prompt: text('A shop system needs its own error. Define `OutOfStock`, a kind of `Exception`, that carries an attribute `missing` (how many more items were wanted than exist). Then write `reserve(stock, qty)` returning the stock left after reserving `qty` items.', 'If `qty` is zero or negative, raise a plain `ValueError` (a bad request, **not** an out-of-stock situation). If `qty` is more than `stock`, raise `OutOfStock` with `missing` set to `qty - stock`. Reserving exactly what is in stock is allowed.'),
      expectedBehavior: 'Returns stock - qty, or raises the right kind of error.',
      starterCode: '',
      hints: ['Which of the two failures is the customer’s mistake, and which is a fact about the shop?', 'Extra facts belong on the exception object itself.', 'What should happen when the quantity equals the stock?'],
      checks: [
        script('The exception class exists and behaves', "assert issubclass(OutOfStock, Exception), 'OutOfStock should be a kind of Exception.'\nassert not issubclass(OutOfStock, ValueError), 'Keep it distinct from ValueError, so callers can tell them apart.'"),
        script('Successful reservations', "assert reserve(10, 3) == 7\nassert reserve(4, 4) == 0, 'Reserving everything is allowed.'\nassert reserve(1, 1) == 0", false),
        script('Too many raises OutOfStock with how many are missing', "try:\n    reserve(3, 8)\n    raise SystemExit('should have raised')\nexcept OutOfStock as e:\n    assert e.missing == 5, 'missing should be qty - stock (5), got %r.' % (getattr(e, 'missing', None),)\ntry:\n    reserve(0, 2)\n    raise SystemExit('should have raised')\nexcept OutOfStock as e:\n    assert e.missing == 2", false),
        script('A bad quantity is a ValueError, not OutOfStock', "for bad in (0, -1, -20):\n    try:\n        reserve(10, bad)\n        raise SystemExit('should have raised for %r' % (bad,))\n    except OutOfStock:\n        raise AssertionError('A non-positive quantity is a bad request (ValueError), not a stock problem.')\n    except ValueError:\n        pass\ntry:\n    reserve(0, 0)\n    raise SystemExit('should have raised')\nexcept OutOfStock:\n    raise AssertionError('Zero is a bad quantity even with no stock.')\nexcept ValueError:\n    pass", false),
      ],
      xpReward: 110, coinReward: 16,
    },
  ],
};
