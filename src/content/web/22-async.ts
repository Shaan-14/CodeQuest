import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

export const HTML = {
  countdown: '<p id="timer">5</p>\n',
  banner: '<p id="banner"></p>\n<button id="pause">Pause</button>\n',
  session: '<label>Notes <input id="field"></label>\n<p id="warn"></p>\n<button id="renew">Stay signed in</button>\n',
};

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-22-async', title: 'Time and Promises', language: 'web', skillId: 'js.async',
    blurb: 'Timers, promises and async/await: code that finishes later.', prerequisites: ['web-21-storage-json'], xpReward: 75,
    reference: {
      title: 'Timers, promises and async/await',
      body: text(
        '`setTimeout(fn, ms)` runs `fn` once later; `setInterval(fn, ms)` runs it repeatedly. Both return an id that `clearTimeout(id)` / `clearInterval(id)` cancel. JavaScript never pauses to wait: it schedules `fn` and carries on.',
        'A **promise** is a value that arrives later. `promise.then(f)` runs `f` on success; `.catch(g)` on failure. `async function` always returns a promise, and inside it `await promise` pauses **that function** (not the page) until the promise settles: a rejected promise becomes a thrown error you can `try/catch`. `Promise.all([a, b])` waits for all of them at once.',
      ),
      example: 'const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\n\nasync function demo() {\n  console.log("start");\n  await wait(500);\n  console.log("half a second later");\n  try {\n    await Promise.reject(new Error("nope"));\n  } catch (e) {\n    console.log("caught", e.message);\n  }\n}\ndemo();\nconsole.log("this prints before the wait ends");',
    },
    steps: [
      { kind: 'teach', title: 'Code that finishes later', body: text('So far every line finished before the next started. Real programs wait: for a timer, a click, a file, a server. JavaScript handles waiting by **scheduling** work: you hand the browser a function and it calls you back.', 'That callback runs later, so anything that depends on it must live **inside** it (or after an `await`). The most common bug is reading a result on the line after starting the work.') },
      webDemo({
        title: 'A page that changes by itself',
        body: text('Run it and watch the page. Then change the delay to 250 ms and make the counter stop at 20 instead of 10.'),
        files: files('<p>Ticks: <span id="ticks">0</span></p>\n', '', 'let ticks = 0;\nconst out = document.querySelector("#ticks");\nconst id = setInterval(() => {\n  ticks++;\n  out.textContent = ticks;\n  if (ticks === 10) clearInterval(id);\n}, 500);\n'),
        notice: 'The interval keeps running until you cancel it. Forgetting `clearInterval` is a classic leak: the page keeps working forever.',
      }),
      { kind: 'challenge', challengeId: 'web-22-countdown' },
      { kind: 'challenge', challengeId: 'web-22-banner-rotator' },
      { kind: 'teach', title: 'Promises and await', body: text('A function that finishes later usually returns a **promise**. With `async`/`await` you write the steps in order, and errors travel by `throw`/`try`/`catch` exactly as in synchronous code.', 'Two rules: `await` only works inside an `async` function, and an `async` function always returns a promise, so callers must `await` it (or use `.then`) to get the value.') },
      { kind: 'challenge', challengeId: 'web-22-retry-task' },
    ],
  },
  objectives: [
    { id: 'js-obj-timers', title: 'Control time with timers', summary: 'Schedule, repeat, cancel and restart timers so the page reacts to time passing (and to activity).' },
    { id: 'js-obj-async-functions', title: 'Write async functions that wait, retry and time out', summary: 'Compose promises with async/await, try/catch and timers; control what happens on success, failure and slowness.' },
  ],
  challenges: [
    wc({
      id: 'web-22-countdown', title: 'The Launch Countdown', mode: 'learning', skillIds: ['js.async'], concepts: ['setInterval', 'clearInterval', 'state'], difficulty: 2, context: 'science',
      prompt: text('`#timer` shows `5`. Once a second it must count down: `4`, `3`, `2`, `1`, and one second after `1` it shows `Go!` and the countdown stops (it never shows `0`, never goes negative, and nothing changes afterwards).'),
      expectedBehavior: 'The number falls once per second until it says Go! and then stays.',
      guidedSteps: ['Keep the remaining seconds in a variable.', 'Use `setInterval` with a delay of 1000 ms.', 'When the variable reaches 0, write `Go!` and call `clearInterval`.'],
      starterFiles: files(HTML.countdown, '', ''), tabs: ['js'],
      hints: ['`setInterval` returns an id; you need it to stop the timer.', 'Decide what to show before you write it: a number or the final message.', '`const id = setInterval(...)` then `clearInterval(id)`.'],
      checks: [
        web('Counting down', "h.eq(h.text('#timer'), '5'); await h.tick(999); h.eq(h.text('#timer'), '5', 'Nothing changes before a full second'); await h.tick(1); h.eq(h.text('#timer'), '4'); await h.tick(3000); h.eq(h.text('#timer'), '1');"),
        web('The end', "await h.tick(4000); h.eq(h.text('#timer'), '1'); await h.tick(1000); h.eq(h.text('#timer'), 'Go!'); await h.tick(5000); h.eq(h.text('#timer'), 'Go!', 'It stops at Go!');", { visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-22-banner-rotator', objectiveId: 'js-obj-timers', title: 'The Store Banner', mode: 'challenge', skillIds: ['js.async'], concepts: ['setInterval', 'clearInterval', 'state'], difficulty: 3, context: 'retail',
      prompt: text(
        'The banner `#banner` shows the messages `Sale ends today`, `Free delivery`, `New arrivals` one after another, changing every **3 seconds** and starting again from the first after the last. It starts on `Sale ends today`.',
        'The button `#pause` reads `Pause` while the banner rotates. Clicking it stops the rotation and changes its label to `Resume`. Clicking again resumes: the label goes back to `Pause` and the banner moves to the **next** message 3 seconds later.',
      ),
      starterFiles: files(HTML.banner, '', ''), tabs: ['js'],
      hints: ['One timer, one index; the index wraps around.', 'Pausing means cancelling the timer; resuming means creating a new one.', '`index = (index + 1) % list.length`, `clearInterval(id)`.'],
      checks: [
        web('Rotating', "h.eq(h.text('#banner'), 'Sale ends today'); await h.tick(2999); h.eq(h.text('#banner'), 'Sale ends today'); await h.tick(1); h.eq(h.text('#banner'), 'Free delivery'); await h.tick(3000); h.eq(h.text('#banner'), 'New arrivals'); await h.tick(3000); h.eq(h.text('#banner'), 'Sale ends today', 'It wraps around');"),
        web('Pausing', "await h.tick(4000); h.eq(h.text('#banner'), 'Free delivery'); h.click('#pause'); h.eq(h.text('#pause'), 'Resume'); await h.tick(20000); h.eq(h.text('#banner'), 'Free delivery', 'A paused banner does not change');", { visible: false }),
        web('Resuming', "await h.tick(4000); h.click('#pause'); await h.tick(10000); h.click('#pause'); h.eq(h.text('#pause'), 'Pause'); await h.tick(2999); h.eq(h.text('#banner'), 'Free delivery', 'A full 3 seconds must pass after resuming'); await h.tick(1); h.eq(h.text('#banner'), 'New arrivals', 'It continues with the next message, not the first'); h.click('#pause'); h.click('#pause'); await h.tick(6000); h.eq(h.text('#banner'), 'Free delivery', 'Only one timer runs: two ticks in 6 seconds');", { visible: false }),
      ],
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-22-session-timeout', objectiveId: 'js-obj-timers', title: 'The Session Timeout', mode: 'challenge', skillIds: ['js.async'], concepts: ['setInterval', 'clearInterval', 'state'], difficulty: 3, context: 'software',
      prompt: text('A secure page ends the session when nobody has touched it for **30 seconds**. When that happens `#warn` shows `Session expired`. Typing in `#field` counts as activity and restarts the 30 seconds. Clicking `#renew` clears the warning and restarts the 30 seconds. Until the time is up, `#warn` is empty.'),
      starterFiles: files(HTML.session, '', ''), tabs: ['js'],
      hints: ['One timer that is restarted, not several that pile up.', 'Cancelling the old timer before creating a new one is the restart.', '`clearTimeout(id)` then `id = setTimeout(...)`.'],
      checks: [
        web('It expires', "h.eq(h.text('#warn'), ''); await h.tick(29999); h.eq(h.text('#warn'), '', 'Not yet'); await h.tick(1); h.eq(h.text('#warn'), 'Session expired');"),
        web('Activity restarts the clock', "await h.tick(20000); h.type('#field', 'a'); await h.tick(29999); h.eq(h.text('#warn'), '', 'Typing restarted the 30 seconds'); await h.tick(1); h.eq(h.text('#warn'), 'Session expired');", { visible: false }),
        web('Renewing', "await h.tick(31000); h.eq(h.text('#warn'), 'Session expired'); h.click('#renew'); h.eq(h.text('#warn'), '', 'Renew clears the warning'); await h.tick(29999); h.eq(h.text('#warn'), ''); await h.tick(1); h.eq(h.text('#warn'), 'Session expired', 'It can expire again');", { visible: false }),
        web('Many keystrokes', "for (let i = 0; i < 5; i++) { await h.tick(10000); h.type('#field', 'x'.repeat(i + 1)); } h.eq(h.text('#warn'), '', 'Still active'); await h.tick(30000); h.eq(h.text('#warn'), 'Session expired');", { visible: false }),
      ],
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-22-retry-task', objectiveId: 'js-obj-async-functions', title: 'The Retry Helper', mode: 'challenge', skillIds: ['js.async'], concepts: ['async/await', 'promises', 'try/catch'], difficulty: 3, context: 'automation',
      prompt: text(
        'Write `async function retry(task, times)`. `task` is a function that returns a promise (it may also throw straight away). Call it; if it succeeds, return its value. If it fails, call it again, up to `times` calls in total. If every call fails, `retry` fails with the error from the **last** call. Do not call `task` more often than needed.',
      ),
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['A loop that counts attempts, and a place to remember the latest error.', 'A failed `await` behaves like a thrown error.', '`for` loop, `try { return await task(); } catch (e) { last = e; }`, `throw last` after the loop.'],
      checks: [
        web('It succeeds after failures', "let n = 0; const flaky = () => { n++; return n < 3 ? Promise.reject(new Error('fail' + n)) : Promise.resolve('ok'); }; const r = await retry(flaky, 5); h.eq(r, 'ok'); h.eq(n, 3, 'It stops calling once it succeeds');"),
        web('It gives up', "let n = 0; let err = null; try { await retry(() => { n++; return Promise.reject(new Error('e' + n)); }, 3); } catch (e) { err = e; } h.assert(err !== null, 'retry should fail when every call fails'); h.eq(err.message, 'e3', 'The last error is reported'); h.eq(n, 3, 'Exactly 3 calls');", { visible: false }),
        web('Once and immediate throws', "let n = 0; h.eq(await retry(() => { n++; return Promise.resolve(7); }, 1), 7); h.eq(n, 1); let m = 0; let err = null; try { await retry(() => { m++; throw new Error('sync' + m); }, 2); } catch (e) { err = e; } h.assert(err !== null, 'A task that throws synchronously counts as a failure'); h.eq(err.message, 'sync2'); h.eq(m, 2); const values = []; h.eq(await retry(async () => { values.push(1); if (values.length < 2) throw new Error('x'); return 'later'; }, 3), 'later');", { visible: false }),
        web('Not a repeat of the first result', "let n = 0; const r = await retry(() => { n++; return n === 1 ? Promise.reject(new Error('a')) : Promise.resolve('second:' + n); }, 2); h.eq(r, 'second:2');", { visible: false }),
      ],
      xpReward: 95, coinReward: 15,
    }),
    wc({
      id: 'web-22-with-timeout', objectiveId: 'js-obj-async-functions', title: 'The Slow Sensor Guard', mode: 'challenge', skillIds: ['js.async'], concepts: ['async/await', 'promises', 'try/catch'], difficulty: 3, context: 'engineering',
      prompt: text(
        'A sensor read can hang. Write `function withTimeout(task, ms)`, where `task` is a function returning a promise. It returns a promise that settles like this: if the task **succeeds** within `ms` milliseconds, it succeeds with the same value; if the task **fails** within `ms`, it fails with the same error; if the task is still running when `ms` milliseconds have passed, it fails with an `Error` whose message is `timeout`. Whichever happens first wins, and a late result is ignored.',
      ),
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two things race: the task and a timer.', 'Wrap the timer in a promise that rejects; a built-in helper can pick the first to settle.', '`new Promise` with `setTimeout`, and `Promise.race([...])`.'],
      checks: [
        web('Fast enough', "let out; withTimeout(() => new Promise((r) => setTimeout(() => r('fast'), 100)), 200).then((v) => { out = 'ok:' + v; }, (e) => { out = 'err:' + e.message; }); await h.tick(99); h.eq(out, undefined, 'Nothing settles early'); await h.tick(2); h.eq(out, 'ok:fast');"),
        web('Too slow', "let out; withTimeout(() => new Promise((r) => setTimeout(() => r('late'), 500)), 200).then((v) => { out = 'ok:' + v; }, (e) => { out = 'err:' + e.message; }); await h.tick(199); h.eq(out, undefined, 'Not yet'); await h.tick(2); h.eq(out, 'err:timeout'); await h.tick(1000); h.eq(out, 'err:timeout', 'A late result is ignored');", { visible: false }),
        web('Failures pass through', "let out; withTimeout(() => new Promise((_, rej) => setTimeout(() => rej(new Error('boom')), 50)), 200).then((v) => { out = 'ok:' + v; }, (e) => { out = 'err:' + e.message; }); await h.tick(60); h.eq(out, 'err:boom', 'The task’s own error is reported'); withTimeout(() => Promise.reject(new Error('instant')), 200).catch((e) => { out = 'err:' + e.message; }); await h.tick(0); h.eq(out, 'err:instant');", { visible: false }),
        web('The value is passed on', "const obj = { n: 1 }; let got; withTimeout(() => Promise.resolve(obj), 10).then((v) => { got = v; }); await h.tick(0); h.assert(got === obj, 'The very same value is returned');", { visible: false }),
      ],
      xpReward: 95, coinReward: 15,
    }),
  ],
};
