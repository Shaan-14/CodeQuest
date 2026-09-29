/**
 * TEST-ONLY DATA. Never imported by the app, so solutions are not shipped in the bundle.
 * For every challenge: `valid` are different correct implementations (all must pass),
 * `wrong` are plausible mistakes (all must fail). content.test.ts runs them in real Python.
 */
export const solutions: Record<string, { valid: string[]; wrong: string[] }> = {
  'py-01-boot-message': {
    valid: ['print("BOLT-7 ONLINE")', "print('BOLT-7 ONLINE')"],
    wrong: ['print("bolt-7 online")', 'print(BOLT-7 ONLINE)', 'print("BOLT-7 ONLINE"']
  },
  'py-01-three-lines': {
    valid: ['print("Booting...")\nprint("Checking sensors...")\nprint("Ready.")', 'print("Booting...\\nChecking sensors...\\nReady.")'],
    wrong: ['print("Ready.")\nprint("Booting...")\nprint("Checking sensors...")', 'print("Booting...")\nprint("Ready.")']
  },
  'py-02-broken-boot': {
    valid: ['print("Motor: OK")\nprint("Sensor: OK")\nprint("Battery: OK")'],
    wrong: ['prnt("Motor: OK")\nprint("Sensor: OK")\nprint("Battery: OK")', 'print("Motor: OK")\nprint("Sensor: OK)\nprint("Battery: OK")']
  },
  'py-02-stray-spaces': {
    valid: ['print("Checking left arm")\nprint("Left arm OK")\nprint("Checking right arm")\nprint("Right arm OK")'],
    wrong: ['print("Checking left arm")\n    print("Left arm OK")\nprint("Checking right arm")\nprint("Right arm OK")', 'print("Left arm OK")']
  },
  'py-03-charge-level': {
    valid: ['battery = 80\nprint(battery)', 'battery = 40 + 40\nprint(battery)'],
    wrong: ['battery = 80\nprint("battery")', 'battery = 8\nprint(battery)', 'print(80)']
  },
  'py-03-overheating': {
    valid: ['temperature = 20\nprint("Temperature:", temperature)\ntemperature = 95\nprint("Temperature:", temperature)',
      'temperature = 20\nprint(f"Temperature: {temperature}")\ntemperature = 95\nprint(f"Temperature: {temperature}")'],
    wrong: ['temperature = 20\nprint("Temperature:", temperature)\nprint("Temperature:", 95)', 'temperature = 95\nprint("Temperature:", temperature)']
  },
  'py-04-name-tag': {
    valid: ['robot_name = "BOLT-7"\nprint("Unit: " + robot_name)', 'robot_name = "BOLT-7"\nprint(f"Unit: {robot_name}")'],
    wrong: ['robot_name = "BOLT-7"\nprint("Unit:" + robot_name)', 'print("Unit: BOLT-7")']
  },
  'py-04-receipt': {
    valid: ['customer = "Dana Ortiz"\nitems = 3\nprint(f"Order for {customer}: {items} items")'],
    wrong: ['customer = "Dana Ortiz"\nitems = 3\nprint("Order for " + customer + ": " + str(items) + " items")', 'print("Order for Dana Ortiz: 3 items")']
  },
  'py-05-power-draw': {
    valid: ['voltage = 12\ncurrent = 2.5\npower = voltage * current\nprint(power)', 'voltage = 12\ncurrent = 2.5\npower = current * voltage\nprint(power)'],
    wrong: ['voltage = 12\ncurrent = 2.5\npower = voltage + current\nprint(power)', 'power = 30\nprint(power)\nprint(1)']
  },
  'py-05-crates': {
    valid: ['bolts = 47\ncrate_size = 12\nprint("Full crates:", bolts // crate_size)\nprint("Leftover bolts:", bolts % crate_size)',
      'bolts = 47\ncrate_size = 12\nfull = bolts // crate_size\nleft = bolts - full * crate_size\nprint(f"Full crates: {full}")\nprint(f"Leftover bolts: {left}")'],
    wrong: ['bolts = 47\ncrate_size = 12\nprint("Full crates:", bolts / crate_size)\nprint("Leftover bolts:", bolts % crate_size)', 'print("Full crates: 3")\nprint("Leftover bolts: 10")']
  },
  'py-05-savings': {
    valid: ['start = 2000\nrate = 0.05\nyears = 3\ntotal = start * (1 + rate) ** years\nprint(total)',
      'start = 2000\nrate = 0.05\nyears = 3\ntotal = start\nfor _ in range(years):\n    total = total * (1 + rate)\nprint(total)'],
    wrong: ['start = 2000\nrate = 0.05\nyears = 3\ntotal = start * rate * years\nprint(total)', 'start = 2000\nrate = 0.05\nyears = 3\ntotal = start + start * rate * years\nprint(total)']
  },
  'py-06-terminal-greeting': {
    valid: ['name = input()\nprint("Welcome, " + name + "!")', 'print(f"Welcome, {input()}!")'],
    wrong: ['name = input()\nprint("Welcome, Sam!")', 'name = input()\nprint("Welcome, " + name)']
  },
  'py-06-ticket-total': {
    valid: ['n = int(input())\nprint("Total:", n * 12)', 'count = int(input("How many? "))\nprint(f"Total: {count * 12}")'],
    wrong: ['n = input()\nprint("Total:", n * 12)', 'n = int(input())\nprint("Total:", n + 12)']
  },
  'py-06-temperature': {
    valid: ['c = float(input())\nprint(c * 9 / 5 + 32)', 'c = float(input())\nf = (c * 9) / 5 + 32\nprint(f)'],
    wrong: ['c = float(input())\nprint(c * 9 // 5 + 32)', 'c = float(input())\nprint(c * 9 / 5)', 'c = int(input())\nprint(int(c * 9 / 5 + 32))']
  },
  'py-07-ready': {
    valid: ['battery = 75\ncan_move = battery > 50\nprint(can_move)'],
    wrong: ['battery = 75\ncan_move = "True"\nprint(can_move)', 'battery = 75\ncan_move = battery < 50\nprint(can_move)']
  },
  'py-07-safe-range': {
    valid: ['p = float(input())\nprint(p >= 60 and p <= 100)', 'p = float(input())\nprint(60 <= p <= 100)',
      'p = float(input())\nif p >= 60 and p <= 100:\n    print(True)\nelse:\n    print(False)'],
    wrong: ['p = float(input())\nprint(p > 60 and p < 100)', 'p = float(input())\nprint(p >= 60)', 'p = int(input())\nprint(60 <= p <= 100)']
  },
  'py-07-pitcher': {
    valid: ['pitches = int(input())\nrest = int(input())\nword = input()\nprint((pitches < 80 and rest >= 4) or word == "override")',
      'a = int(input())\nb = int(input())\nc = input()\nif c == "override":\n    print(True)\nelif a < 80 and b >= 4:\n    print(True)\nelse:\n    print(False)'],
    wrong: ['a = int(input())\nb = int(input())\nc = input()\nprint(a < 80 and b >= 4 and c == "override")', 'a = int(input())\nb = int(input())\nc = input()\nprint((a <= 80 and b >= 4) or c == "override")']
  },
  'py-08-battery-check': {
    valid: ['battery = int(input())\nif battery < 20:\n    print("Low battery")\nelse:\n    print("Battery OK")'],
    wrong: ['battery = int(input())\nif battery <= 20:\n    print("Low battery")\nelse:\n    print("Battery OK")', 'battery = int(input())\nprint("Low battery")']
  },
  'py-08-free-shipping': {
    valid: ['total = float(input())\nif total >= 50:\n    print("Free shipping")\nelse:\n    print("Shipping: 5")',
      'total = float(input())\nif total < 50:\n    print("Shipping: 5")\nelse:\n    print("Free shipping")'],
    wrong: ['total = float(input())\nif total > 50:\n    print("Free shipping")\nelse:\n    print("Shipping: 5")', 'total = int(input())\nif total >= 50:\n    print("Free shipping")\nelse:\n    print("Shipping: 5")']
  },
  'py-09-speed-zone': {
    valid: ['speed = int(input())\nif speed == 0:\n    print("Stopped")\nelif speed <= 5:\n    print("Walking")\nelse:\n    print("Running")'],
    wrong: ['speed = int(input())\nif speed == 0:\n    print("Stopped")\nelif speed < 5:\n    print("Walking")\nelse:\n    print("Running")', 'speed = int(input())\nif speed <= 5:\n    print("Walking")\nelif speed == 0:\n    print("Stopped")\nelse:\n    print("Running")']
  },
  'py-09-fizzbuzz': {
    valid: ['n = int(input())\nif n % 15 == 0:\n    print("FizzBuzz")\nelif n % 3 == 0:\n    print("Fizz")\nelif n % 5 == 0:\n    print("Buzz")\nelse:\n    print(n)',
      'n = int(input())\nif n % 3 == 0 and n % 5 == 0:\n    print("FizzBuzz")\nelif n % 5 == 0:\n    print("Buzz")\nelif n % 3 == 0:\n    print("Fizz")\nelse:\n    print(n)'],
    wrong: ['n = int(input())\nif n % 3 == 0:\n    print("Fizz")\nelif n % 5 == 0:\n    print("Buzz")\nelif n % 15 == 0:\n    print("FizzBuzz")\nelse:\n    print(n)']
  },
  'py-10-countdown': {
    valid: ['n = 5\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Liftoff!")', 'n = 5\nwhile n >= 1:\n    print(n)\n    n -= 1\nprint("Liftoff!")'],
    wrong: ['n = 5\nwhile n > 0:\n    print(n)\n    n = n - 1\n    print("Liftoff!")', 'n = 5\nwhile n > 1:\n    print(n)\n    n = n - 1\nprint("Liftoff!")', 'print(5)\nprint(4)\nprint(3)\nprint(2)\nprint(1)\nprint("Liftoff!")']
  },
  'py-10-savings-goal': {
    valid: ['balance = 100\ngoal = 500\nmonths = 0\nwhile balance < goal:\n    balance = balance + 30\n    months = months + 1\nprint("Months:", months)',
      'balance = 100\ngoal = 500\nm = 0\nwhile not balance >= goal:\n    balance += 30\n    m += 1\nprint(f"Months: {m}")'],
    wrong: ['balance = 100\ngoal = 500\nprint("Months: 14")']
  },
  'py-10-password': {
    valid: ['tries = 1\nguess = input()\nwhile guess != "open sesame":\n    guess = input()\n    tries += 1\nprint("Access granted after", tries, "tries")',
      'tries = 0\nwhile True:\n    guess = input()\n    tries += 1\n    if guess == "open sesame":\n        break\nprint(f"Access granted after {tries} tries")'],
    wrong: ['tries = 0\nguess = ""\nwhile guess != "open sesame":\n    guess = input()\nprint("Access granted after", tries, "tries")', 'guess = input()\nprint("Access granted after 3 tries")']
  },
  'py-11-sensor-sweep': {
    valid: ['for n in range(1, 6):\n    print("Sensor", n, "OK")', 'for n in range(5):\n    print(f"Sensor {n + 1} OK")'],
    wrong: ['for n in range(5):\n    print("Sensor", n, "OK")', 'for n in range(1, 5):\n    print("Sensor", n, "OK")', 'for n in [1, 2, 3, 4, 5]:\n    print("Sensor", n, "OK")']
  },
  'py-11-average': {
    valid: ['total = 0\nfor i in range(5):\n    total += int(input())\nprint("Average:", total / 5)', 'readings = []\nfor _ in range(5):\n    readings.append(int(input()))\nprint(f"Average: {sum(readings) / len(readings)}")'],
    wrong: ['total = 0\nfor i in range(5):\n    total += int(input())\nprint("Average:", total // 5)', 'total = 0\nfor i in range(4):\n    total += int(input())\nprint("Average:", total / 5)']
  },
  'py-12-double': {
    valid: ['def double(x):\n    return x * 2', 'def double(x):\n    return x + x', 'def double(n):\n    result = n * 2\n    return result'],
    wrong: ['def double(x):\n    print(x * 2)', 'def double(x):\n    return x * x', 'def double(x):\n    x * 2']
  },
  'py-12-announce': {
    valid: ['def announce(name):\n    print("Unit " + name + " reporting")', 'def announce(name):\n    print(f"Unit {name} reporting")'],
    wrong: ['def announce(name):\n    return "Unit " + name + " reporting"', 'def announce(name):\n    print("Unit BOLT-7 reporting")']
  },
  'py-12-discount': {
    valid: ['def total_price(unit_price, quantity):\n    total = unit_price * quantity\n    if quantity >= 10:\n        total = total * 0.9\n    return total',
      'def total_price(unit_price, quantity):\n    if quantity >= 10:\n        return unit_price * quantity * 0.9\n    else:\n        return unit_price * quantity'],
    wrong: ['def total_price(unit_price, quantity):\n    total = unit_price * quantity\n    if quantity > 10:\n        total = total * 0.9\n    return total', 'def total_price(unit_price, quantity):\n    return unit_price * quantity * 0.9', 'def total_price(unit_price, quantity):\n    total = unit_price * quantity\n    if quantity >= 10:\n        total = total - 10\n    return total']
  },
  'py-13-control-program': {
    valid: ['def status(battery):\n    if battery < 10:\n        return "CRITICAL"\n    elif battery < 40:\n        return "LOW"\n    else:\n        return "OK"\n\nfor i in range(3):\n    print(status(int(input())))',
      'def status(battery):\n    if battery >= 40:\n        return "OK"\n    if battery >= 10:\n        return "LOW"\n    return "CRITICAL"\n\nreadings = [int(input()) for _ in range(3)]\nfor r in readings:\n    print(status(r))'],
    wrong: ['def status(battery):\n    if battery <= 10:\n        return "CRITICAL"\n    elif battery < 40:\n        return "LOW"\n    else:\n        return "OK"\n\nfor i in range(3):\n    print(status(int(input())))', 'def status(battery):\n    return "OK"\n\nfor i in range(3):\n    print(status(int(input())))']
  },
  'py-14-warehouse-audit': {
    valid: ['total = 0\nbest = 0\nline = input()\nwhile line != "DONE":\n    n = int(line)\n    total += n\n    if n > best:\n        best = n\n    line = input()\nprint("Total:", total)\nprint("Busiest:", best)',
      'nums = []\nwhile True:\n    s = input()\n    if s == "DONE":\n        break\n    nums.append(int(s))\nprint(f"Total: {sum(nums)}")\nprint(f"Busiest: {max(nums)}")'],
    wrong: ['total = 0\nline = input()\nwhile line != "DONE":\n    total += int(line)\n    line = input()\nprint("Total:", total)\nprint("Busiest:", total)', 'total = 0\nbest = 1\nline = input()\nwhile line != "DONE":\n    n = int(line)\n    total += n\n    if n > best:\n        best = n\n    line = input()\nprint("Total:", total)\nprint("Busiest:", best)']
  }
};
