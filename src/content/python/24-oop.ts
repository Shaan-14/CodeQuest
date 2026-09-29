import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const script = (name: string, code: string, visible = true): Check => ({ kind: 'script', name, code, visible });
const raises = (call: string, why: string) => `try:\n    ${call}\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError(${JSON.stringify(why)})`;

const MACHINE_BASE = 'class Machine:\n    def __init__(self, name, hours=0):\n        self.name = name\n        self.hours = hours\n\n    def describe(self):\n        return f"{self.name} ({self.hours} h)"\n';
const ENTITY_BASE = 'class Entity:\n    def __init__(self, name, hp):\n        self.name = name\n        self.hp = hp\n\n    def is_alive(self):\n        return self.hp > 0\n\n    def describe(self):\n        return f"{self.name} [{self.hp} hp]"\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-24-oop', title: 'Modelling the World with Objects', language: 'python', skillId: 'sd.oop',
    blurb: 'Classes, objects, methods, encapsulation, composition and inheritance.', prerequisites: ['py-23-testing'], xpReward: 60,
    reference: {
      title: 'Classes and objects',
      body: text(
        'A **class** is a blueprint; an **object** is one thing built from it. `class Machine:` with `def __init__(self, name):` (the constructor) that stores **attributes** (`self.name = name`), and **methods** (functions inside the class that take `self`) that use and change them. `m = Machine("Press")` builds one; `m.run(5)` calls a method.',
        '**Encapsulation**: the object protects its own state. Instead of letting anyone set `balance = -500`, provide `withdraw()` that checks the rules and raises `ValueError`. **Composition**: an object HAS other objects (a `Factory` has a list of `Machine`s). **Inheritance**: `class CNC(Machine):` IS a Machine with extras; `super().__init__(...)` runs the parent’s constructor; overriding a method replaces it for the child.',
        'Use classes when things have **state that changes** and **behaviour tied to that state**: machines, accounts, inventories, game characters. Do not use a class for something a plain function does.',
      ),
      example: 'class Account:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n    def deposit(self, amount):\n        self.balance += amount',
    },
    steps: [
      {
        kind: 'teach', title: 'Why objects?',
        body: text(
          'Imagine tracking 50 machines with dictionaries and functions: every function must be told which dictionary to change, and nothing stops a bug from setting hours to -5. A **class** bundles the data (a machine’s name, hours run) with the behaviour that belongs to it (run, service, check if service is due) in one place. Each machine you create is its own **object** with its own state.',
          'Object-oriented design is really about **modelling**: choosing what things in the problem exist, what each one knows, and what each one can do. Machines, accounts, inventories, game characters, datasets, database connections. Nearly every library you will use hands you objects.',
        ),
      },
      {
        kind: 'demo', title: 'A class and two objects',
        body: text('Run it. Notice that the two accounts have separate balances even though they came from the same blueprint.'),
        code: 'class Account:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, amount):\n        self.balance += amount\n\n    def __str__(self):\n        return f"{self.owner}: {self.balance}"\n\nada = Account("Ada", 100)\nbo = Account("Bo")\nada.deposit(50)\nprint(ada)\nprint(bo)\nprint(ada.balance, bo.balance)',
        notice: '`__init__` ran when each object was created. `self` means “this particular object”, which is why `ada.deposit(50)` changed Ada’s balance and not Bo’s. `__str__` decides what `print(object)` shows.',
      },
      {
        kind: 'teach', title: 'Objects that protect themselves',
        body: text(
          'The point of putting behaviour in the class is that the class can enforce **rules**. A `withdraw` method can refuse to overdraw the account. Code that uses the account no longer needs to remember the rule, and cannot forget it. This idea is called **encapsulation**.',
        ),
      },
      {
        kind: 'demo', title: 'Composition and inheritance', 
        body: text('A `CNCMachine` is a kind of `Machine` (inheritance). A `Factory` holds machines (composition). Predict the output first.'),
        code: 'class Machine:\n    def __init__(self, name, hours=0):\n        self.name = name\n        self.hours = hours\n    def describe(self):\n        return f"{self.name} ({self.hours} h)"\n\nclass CNCMachine(Machine):\n    def __init__(self, name, tool, hours=0):\n        super().__init__(name, hours)\n        self.tool = tool\n    def describe(self):\n        return super().describe() + f", tool: {self.tool}"\n\nclass Factory:\n    def __init__(self):\n        self.machines = []\n    def add(self, machine):\n        self.machines.append(machine)\n    def total_hours(self):\n        return sum(m.hours for m in self.machines)\n\nf = Factory()\nf.add(Machine("Press", 10))\nf.add(CNCMachine("Mill", "drill", 5))\nfor m in f.machines:\n    print(m.describe())\nprint(f.total_hours())',
        notice: 'The loop called `describe()` on both objects and each answered in its own way: that is polymorphism. `super()` let the child reuse the parent’s code instead of copying it. The factory did not need to know what KIND of machine each was.',
      },
      { kind: 'challenge', challengeId: 'py-24-account' },
      { kind: 'challenge', challengeId: 'py-24-machine' },
      { kind: 'challenge', challengeId: 'py-24-inventory' },
      { kind: 'challenge', challengeId: 'py-24-cnc' },
    ],
  },
  objectives: [
    { id: 'py-obj-class-state', title: 'Model a thing with state and behaviour', summary: 'Write a class whose methods read and change its attributes, with independent instances.' },
    { id: 'py-obj-encapsulation', title: 'Enforce rules inside a class', summary: 'Make methods validate input and raise ValueError, leaving the object unchanged on failure.' },
    { id: 'py-obj-inherit-compose', title: 'Extend a class, and combine objects', summary: 'Subclass with super(), override a method, and build a class that holds other objects.' },
  ],
  challenges: [
    {
      id: 'py-24-account', title: 'A Bank Account', mode: 'learning', language: 'python', skillIds: ['sd.oop', 'py.functions'], concepts: ['class', '__init__', 'attributes', 'methods'], difficulty: 2, context: 'finance',
      prompt: text('Write a class `Account`. Creating one takes an `owner` and an optional starting `balance` (default `0`), and remembers both as attributes `owner` and `balance`. It has two methods:', '`deposit(amount)` adds to the balance.\n`withdraw(amount)` subtracts from the balance and returns `True` if the account has enough money. If it does not, it changes nothing and returns `False`.'),
      expectedBehavior: 'a = Account("Ada", 100); a.deposit(50) makes a.balance 150; a.withdraw(500) returns False and leaves the balance at 150.',
      guidedSteps: ['Write `class Account:` and an `__init__(self, owner, balance=0)` that stores both.', 'Add `deposit` that increases `self.balance`.', 'Add `withdraw` that checks the balance first, and returns True or False.'],
      starterCode: 'class Account:\n    pass\n',
      hints: ['The constructor is the method named `__init__`. Its first parameter is always `self`.', 'Attributes are created by assigning to `self.something` inside methods.', '`withdraw`: `if amount <= self.balance:` subtract and `return True`; otherwise `return False`.'],
      checks: [
        script('A new account remembers its owner and balance', 'a = Account("Ada", 100)\nassert a.owner == "Ada" and a.balance == 100, "A new account should remember its owner and starting balance."'),
        script('The balance defaults to 0', 'assert Account("Bo").balance == 0, "The starting balance should default to 0."'),
        script('deposit adds money', 'a = Account("Ada", 100)\na.deposit(50)\nassert a.balance == 150, "deposit should add the amount to the balance."'),
        script('withdraw takes money and returns True', 'a = Account("Ada", 100)\nassert a.withdraw(30) is True, "withdraw should return True when it succeeds."\nassert a.balance == 70, "withdraw should reduce the balance."'),
        script('withdraw refuses when there is not enough', 'a = Account("Ada", 100)\nassert a.withdraw(500) is False, "withdraw should return False when the balance is too low."\nassert a.balance == 100, "A refused withdrawal must not change the balance."', false),
        script('Withdrawing exactly the balance is allowed', 'a = Account("Ada", 100)\nassert a.withdraw(100) is True and a.balance == 0, "Withdrawing exactly what is there should be allowed."', false),
        script('Accounts do not share state', 'a = Account("A", 10)\nb = Account("B", 20)\na.deposit(5)\nassert b.balance == 20 and a.balance == 15, "Each account must keep its own balance."', false),
      ],
      constraints: [{ type: 'requires', node: 'ClassDef', message: 'Define the class with class.' }],
      xpReward: 60, coinReward: 8,
    },
    {
      id: 'py-24-machine', objectiveId: 'py-obj-class-state', title: 'A Machine that Needs Servicing', mode: 'challenge', language: 'python', skillIds: ['sd.oop', 'py.functions'], concepts: ['class', '__init__', 'attributes', 'methods', 'state'], difficulty: 3, context: 'manufacturing',
      prompt: text('A factory tracks how long each machine has run since it was last serviced. Write a class `Machine`. Creating one takes a `name` and a `service_after` limit in hours. It has an attribute `hours_run` that starts at `0`, and methods:', '`run(hours)`: adds to `hours_run`.\n`needs_service()`: returns `True` once `hours_run` has **reached or passed** the limit, otherwise `False`.\n`service()`: resets `hours_run` to `0`.'),
      expectedBehavior: 'Machine("Press", 100) needs service after 100 hours of running, and not before; service() resets the count.',
      starterCode: '',
      hints: ['The class stores three things: a name, the limit, and the hours so far. Which of them ever changes?', 'Each method either changes an attribute (`run`, `service`) or answers a question about them (`needs_service`).', '`needs_service` is a single comparison between two attributes. Decide whether the limit itself counts as “reached”.'],
      checks: [
        script('A new machine has run 0 hours', 'm = Machine("Press", 100)\nassert m.name == "Press" and m.hours_run == 0, "A new machine should remember its name and start with hours_run 0."'),
        script('run adds hours', 'm = Machine("Press", 100)\nm.run(30)\nm.run(20)\nassert m.hours_run == 50, "run should add to hours_run each time."'),
        script('Service is due exactly at the limit', 'm = Machine("Press", 100)\nm.run(99)\nassert m.needs_service() is False, "99 of 100 hours: not due yet."\nm.run(1)\nassert m.needs_service() is True, "Reaching the limit exactly means service is due."'),
        script('service resets the count', 'm = Machine("Press", 100)\nm.run(150)\nassert m.needs_service() is True\nm.service()\nassert m.hours_run == 0 and m.needs_service() is False, "service should reset hours_run to 0."', false),
        script('Machines do not share state', 'a = Machine("A", 10)\nb = Machine("B", 10)\na.run(20)\nassert b.hours_run == 0 and b.needs_service() is False, "Each machine must keep its own hours."', false),
      ],
      constraints: [{ type: 'requires', node: 'ClassDef', message: 'Define the class with class.' }],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'py-24-battery', objectiveId: 'py-obj-class-state', title: 'A Game Battery', mode: 'challenge', language: 'python', skillIds: ['sd.oop', 'py.functions'], concepts: ['class', '__init__', 'attributes', 'methods', 'state'], difficulty: 3, context: 'games',
      prompt: text('A game’s power suit runs on a battery. Write a class `Battery`. Creating one takes a `capacity`, and the attribute `level` starts **full** (equal to the capacity). Methods:', '`use(amount)`: reduces `level` by `amount`, but never below `0`.\n`recharge()`: fills the battery back to its capacity.\n`percent()`: returns the level as a percentage of capacity (a float, e.g. `50.0`).'),
      expectedBehavior: 'Battery(200): use(50) leaves level 150; use(500) leaves level 0; recharge() returns it to 200; percent() is level ÷ capacity × 100.',
      starterCode: '',
      hints: ['The class needs to remember its capacity as well as its current level.', 'One of the methods can make the level go wrong if you are not careful. Which one, and what protects it?', '`use`: `self.level = max(0, self.level - amount)`. `percent`: `self.level / self.capacity * 100`.'],
      checks: [
        script('A new battery is full', 'b = Battery(200)\nassert b.level == 200, "A new battery should start full."'),
        script('use lowers the level', 'b = Battery(200)\nb.use(50)\nassert b.level == 150, "use should reduce the level by the amount."'),
        script('percent reports the charge', 'b = Battery(200)\nb.use(100)\nassert abs(b.percent() - 50.0) < 1e-9, "percent should be level / capacity * 100."'),
        script('The level never goes below zero', 'b = Battery(100)\nb.use(500)\nassert b.level == 0, "Using more than is left should leave 0, not a negative level."', false),
        script('recharge fills it up', 'b = Battery(100)\nb.use(70)\nb.recharge()\nassert b.level == 100, "recharge should fill the battery to its capacity."', false),
        script('Batteries do not share state', 'a = Battery(10)\nb = Battery(10)\na.use(5)\nassert b.level == 10, "Each battery must keep its own level."', false),
      ],
      constraints: [{ type: 'requires', node: 'ClassDef', message: 'Define the class with class.' }],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'py-24-inventory', objectiveId: 'py-obj-encapsulation', title: 'A Protected Inventory', mode: 'challenge', language: 'python', skillIds: ['sd.oop', 'py.defensive', 'py.dicts'], concepts: ['class', 'encapsulation', 'validation', 'ValueError'], difficulty: 3, context: 'logistics',
      prompt: text('Write a class `Inventory` (created with no arguments) that keeps track of stock and **protects its own rules**:', '`add(item, qty)`: adds `qty` of `item`. `qty` must be a positive whole number, otherwise raise `ValueError`.\n`remove(item, qty)`: removes stock. Raise `ValueError` if the item is unknown or there is not enough. When it fails, nothing changes.\n`count(item)`: how many of `item` are in stock (`0` for an unknown item).'),
      expectedBehavior: 'add("bolt", 10); remove("bolt", 3) leaves 7; remove("bolt", 50) raises ValueError and leaves 7.',
      starterCode: '',
      hints: ['The rules live in the class, so callers cannot break them by accident.', 'Check the rules BEFORE changing anything, so a failure leaves the inventory as it was.', 'A dictionary of counts works well inside. `raise ValueError(...)` when a rule is broken; `count` can use `.get(item, 0)`.'],
      checks: [
        script('add and count', 'inv = Inventory()\ninv.add("bolt", 10)\ninv.add("bolt", 5)\nassert inv.count("bolt") == 15, "add should increase the count."'),
        script('Unknown items count as zero', 'assert Inventory().count("nothing") == 0, "An unknown item should count as 0."'),
        script('remove reduces stock', 'inv = Inventory()\ninv.add("bolt", 10)\ninv.remove("bolt", 3)\nassert inv.count("bolt") == 7, "remove should reduce the count."'),
        script('Removing too many is refused and changes nothing', 'inv = Inventory()\ninv.add("bolt", 10)\n' + raises('inv.remove("bolt", 50)', 'Removing more than is in stock should raise ValueError.') + '\nassert inv.count("bolt") == 10, "A refused removal must leave the stock unchanged."', false),
        script('Removing an unknown item is refused', 'inv = Inventory()\n' + raises('inv.remove("ghost", 1)', 'Removing an item that was never added should raise ValueError.'), false),
        script('Bad quantities are refused', 'inv = Inventory()\n' + raises('inv.add("bolt", 0)', 'Adding 0 should raise ValueError.') + '\n' + raises('inv.add("bolt", -2)', 'Adding a negative quantity should raise ValueError.') + '\n' + raises('inv.add("bolt", 1.5)', 'Adding a fractional quantity should raise ValueError.') + '\nassert inv.count("bolt") == 0, "Refused additions must not create stock."', false),
        script('Removing everything leaves zero', 'inv = Inventory()\ninv.add("nut", 4)\ninv.remove("nut", 4)\nassert inv.count("nut") == 0, "Removing all the stock should leave 0."', false),
        script('Inventories do not share stock', 'a = Inventory()\nb = Inventory()\na.add("x", 1)\nassert b.count("x") == 0, "Each inventory must keep its own stock."', false),
      ],
      constraints: [{ type: 'requires', node: 'ClassDef', message: 'Define the class with class.' }],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'py-24-thermostat', objectiveId: 'py-obj-encapsulation', title: 'A Safe Thermostat', mode: 'challenge', language: 'python', skillIds: ['sd.oop', 'py.defensive', 'py.dicts'], concepts: ['class', 'encapsulation', 'validation', 'ValueError'], difficulty: 3, context: 'engineering',
      prompt: text('Write a class `Thermostat` for a building system. Creating one takes an optional `target` temperature (default `20`). It **protects a safe range**:', '`set_target(t)`: changes the target, but only for values from `10` to `30` **inclusive**. Anything else raises `ValueError` and leaves the target unchanged.\n`should_heat(current)`: returns `True` when `current` is **below** the target.\nThe target is available as the attribute `target`.'),
      expectedBehavior: 'Thermostat() has target 20. set_target(35) raises ValueError and the target stays 20. should_heat(19.5) is True; should_heat(20) is False.',
      starterCode: '',
      hints: ['The interesting rule is what `set_target` refuses.', 'Decide the range check first, raise before changing anything, and keep the boundaries in mind.', '`if not 10 <= t <= 30: raise ValueError("...")`, otherwise `self.target = t`.'],
      checks: [
        script('The default target is 20', 'assert Thermostat().target == 20, "The default target should be 20."'),
        script('A valid target is accepted', 't = Thermostat()\nt.set_target(24)\nassert t.target == 24, "set_target should change the target."'),
        script('should_heat compares with the target', 't = Thermostat(22)\nassert t.should_heat(21.9) is True, "Below the target: heat."\nassert t.should_heat(22) is False, "At the target: no heating needed."'),
        script('Too hot is refused, and nothing changes', 't = Thermostat()\n' + raises('t.set_target(35)', 'A target above 30 should raise ValueError.') + '\nassert t.target == 20, "A refused change must leave the target as it was."', false),
        script('Too cold is refused', 't = Thermostat()\n' + raises('t.set_target(9.9)', 'A target below 10 should raise ValueError.'), false),
        script('The limits themselves are allowed', 't = Thermostat()\nt.set_target(10)\nassert t.target == 10\nt.set_target(30)\nassert t.target == 30, "10 and 30 are both valid targets."', false),
        script('A custom starting target', 'assert Thermostat(15).target == 15, "The constructor should accept a starting target."', false),
      ],
      constraints: [{ type: 'requires', node: 'ClassDef', message: 'Define the class with class.' }],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'py-24-cnc', objectiveId: 'py-obj-inherit-compose', title: 'CNC Machines and a Factory', mode: 'challenge', language: 'python', skillIds: ['sd.oop', 'ps.decomposition'], concepts: ['inheritance', 'super', 'method overriding', 'composition', 'polymorphism'], difficulty: 4, context: 'manufacturing', project: true,
      prompt: text(
        'A `Machine` class is provided. Extend it and build on it:',
        '**`CNCMachine`** is a kind of `Machine`. Creating one takes `name`, `tool`, and an optional `hours` (default `0`). It keeps the `tool`, and its `describe()` returns the normal description followed by `, tool: ` and the tool, for example `Mill 1 (12 h), tool: drill`.',
        '**`Factory`** (created with no arguments) **holds machines**. `add(machine)` adds one; `total_hours()` returns the sum of all their `hours`; `describe_all()` returns a list with each machine’s `describe()` text, in the order they were added. It must work for any kind of machine.',
      ),
      expectedBehavior: 'A factory with Machine("A", 5) and CNCMachine("B", "saw", 7) has total_hours() 12 and describe_all() ["A (5 h)", "B (7 h), tool: saw"].',
      starterCode: MACHINE_BASE,
      hints: ['Two separate ideas: one class EXTENDS another, and one class CONTAINS objects.', 'For the subclass, pass the shared attributes up to the parent with `super().__init__(...)` and build on the parent’s `describe()`.', 'The factory only needs a list of machines. Because every machine has `describe()` and `hours`, the factory does not care what kind each one is.'],
      checks: [
        script('CNCMachine is a Machine', 'assert issubclass(CNCMachine, Machine), "CNCMachine should extend Machine."'),
        script('describe() adds the tool', 'c = CNCMachine("Mill 1", "drill", 12)\nassert c.describe() == "Mill 1 (12 h), tool: drill", "describe() should be the normal description followed by \', tool: <tool>\'."'),
        script('hours default to 0', 'c = CNCMachine("M", "saw")\nassert c.hours == 0 and c.tool == "saw", "hours should default to 0 and the tool should be remembered."', false),
        script('A factory totals the hours of its machines', 'f = Factory()\nf.add(Machine("A", 5))\nf.add(CNCMachine("B", "saw", 7))\nassert f.total_hours() == 12, "total_hours should add up every machine\'s hours."'),
        script('describe_all uses each machine\'s own description', 'f = Factory()\nf.add(Machine("A", 5))\nf.add(CNCMachine("B", "saw", 7))\nassert f.describe_all() == ["A (5 h)", "B (7 h), tool: saw"], "describe_all should call describe() on each machine, in the order added."'),
        script('An empty factory', 'f = Factory()\nassert f.total_hours() == 0 and f.describe_all() == [], "An empty factory has 0 hours and nothing to describe."', false),
        script('Factories do not share machines', 'f1 = Factory()\nf2 = Factory()\nf1.add(Machine("x", 1))\nassert f2.total_hours() == 0 and f2.describe_all() == [], "Each factory must keep its own list of machines."', false),
      ],
      constraints: [
        { type: 'requires', node: 'ClassDef', message: 'Define the classes with class.' },
        { type: 'requires', node: 'call:super', message: 'Use super() so the subclass builds on the parent instead of copying it.' },
      ],
      xpReward: 110, coinReward: 15,
    },
    {
      id: 'py-24-party', objectiveId: 'py-obj-inherit-compose', title: 'A Party of Adventurers', mode: 'challenge', language: 'python', skillIds: ['sd.oop', 'ps.decomposition'], concepts: ['inheritance', 'super', 'method overriding', 'composition', 'polymorphism'], difficulty: 4, context: 'games', project: true,
      prompt: text(
        'A game has an `Entity` class (provided). Extend it and build on it:',
        '**`Player`** is a kind of `Entity`. Creating one takes `name`, `hp`, and an optional `level` (default `1`). It keeps the `level`, and its `describe()` returns the normal description followed by ` level ` and the level, for example `Ada [30 hp] level 3`.',
        '**`Party`** (created with no arguments) **holds players**. `add(player)` adds one; `total_hp()` returns the sum of all their `hp`; `alive_names()` returns the names of the players who are alive, **sorted alphabetically**.',
      ),
      expectedBehavior: 'A party with Player("Zed", 0) and Player("Ada", 30, 3) has total_hp() 30 and alive_names() ["Ada"].',
      starterCode: ENTITY_BASE,
      hints: ['One class extends another; another class holds objects of that kind.', 'The subclass passes shared attributes to the parent with `super().__init__(...)`, then adds its own.', 'The party needs a list. Use the parent’s `is_alive()` rather than repeating its rule.'],
      checks: [
        script('Player is an Entity', 'assert issubclass(Player, Entity), "Player should extend Entity."'),
        script('describe() adds the level', 'p = Player("Ada", 30, 3)\nassert p.describe() == "Ada [30 hp] level 3", "describe() should be the normal description followed by \' level <level>\'."'),
        script('The level defaults to 1', 'p = Player("Bo", 10)\nassert p.level == 1 and p.is_alive(), "level should default to 1 and players should keep the Entity behaviour."', false),
        script('total_hp adds up the players', 'party = Party()\nparty.add(Player("Zed", 0))\nparty.add(Player("Ada", 30, 3))\nassert party.total_hp() == 30, "total_hp should add up every player\'s hp."'),
        script('alive_names lists the living, sorted', 'party = Party()\nparty.add(Player("Zed", 5))\nparty.add(Player("Bo", 0))\nparty.add(Player("Ada", 30, 3))\nassert party.alive_names() == ["Ada", "Zed"], "alive_names should list the living players, alphabetically."'),
        script('An empty party', 'party = Party()\nassert party.total_hp() == 0 and party.alive_names() == [], "An empty party has 0 hp and nobody alive."', false),
        script('Parties do not share players', 'a = Party()\nb = Party()\na.add(Player("x", 1))\nassert b.total_hp() == 0, "Each party must keep its own players."', false),
      ],
      constraints: [
        { type: 'requires', node: 'ClassDef', message: 'Define the classes with class.' },
        { type: 'requires', node: 'call:super', message: 'Use super() so the subclass builds on the parent instead of copying it.' },
      ],
      xpReward: 110, coinReward: 15,
    },
  ],
};
