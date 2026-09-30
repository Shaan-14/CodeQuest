import { text } from '../helpers';
import type { LessonBundle, WebCheck } from '../schema';
import { files, wc, web, webDemo } from './helpers';

type Step = { values: Record<string, string>; errors: Record<string, string>; result: string };

/** One check that fills the form and submits it several times, asserting the messages after each submit. */
export function formCheck(name: string, form: string, steps: Step[], opts: Partial<Omit<WebCheck, 'kind' | 'name' | 'script'>> = {}): WebCheck {
  const body = steps
    .map((s, i) => {
      const fill = Object.entries(s.values).map(([k, v]) => `h.type('#${k}', ${JSON.stringify(v)});`).join(' ');
      const errs = Object.entries(s.errors).map(([k, m]) => `h.eq(h.text('#${k}-error'), ${JSON.stringify(m)}, 'The message under ${k}${steps.length > 1 ? ' (submit ' + (i + 1) + ')' : ''}');`).join(' ');
      return `${fill} h.click('${form} button[type=submit]'); h.assert(prevented === true, 'Stop the browser from sending the form itself.'); ${errs} h.eq(h.text('#result'), ${JSON.stringify(s.result)}, 'The result line${steps.length > 1 ? ' (submit ' + (i + 1) + ')' : ''}');`;
    })
    .join('\n');
  return web(name, `let prevented = null; document.addEventListener('submit', (e) => { prevented = e.defaultPrevented; });\n${body}`, opts);
}

const formHtml = (id: string, fields: { id: string; label: string; type?: string }[], button: string) =>
  `<form id="${id}" novalidate>\n${fields.map((f) => `  <label>${f.label} <input id="${f.id}" type="${f.type ?? 'text'}"></label>\n  <span class="error" id="${f.id}-error"></span>\n`).join('')}  <button type="submit">${button}</button>\n</form>\n<p id="result"></p>\n`;

const SIGNUP_HTML = formHtml('signup', [{ id: 'email', label: 'Email' }, { id: 'password', label: 'Password', type: 'password' }, { id: 'confirm', label: 'Repeat password', type: 'password' }], 'Create account');
const ORDER_HTML = formHtml('order', [{ id: 'name', label: 'Name' }, { id: 'qty', label: 'Quantity' }, { id: 'code', label: 'Discount code (optional)' }], 'Place order');
const SENSOR_HTML = formHtml('reading', [{ id: 'sensor', label: 'Sensor' }, { id: 'value', label: 'Reading (°C)' }, { id: 'note', label: 'Note' }], 'Log reading');
const CONTACT_HTML = formHtml('contact', [{ id: 'name', label: 'Name' }, { id: 'message', label: 'Message' }], 'Send');
export const formsHtml = { SIGNUP_HTML, ORDER_HTML, SENSOR_HTML, CONTACT_HTML };

const E = (o: Record<string, string>) => ({ email: '', password: '', confirm: '', ...o });
const OK = 'Welcome, ada@example.com';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-20-forms-js', title: 'Forms in JavaScript', language: 'web', skillId: 'js.forms',
    blurb: 'Take over form submission, validate input, and give useful messages.', prerequisites: ['web-19-events'], xpReward: 70,
    reference: {
      title: 'Forms and validation in JavaScript',
      body: text(
        'A form fires a `submit` event. `event.preventDefault()` stops the browser sending the page away so **your** code can decide what to do. Read values with `input.value` (always a **string**, even for `type="number"`), tidy them with `.trim()`, convert with `Number(...)`, and check them with comparisons and regular expressions.',
        '**Validate, then show.** Collect a message per field (empty string = fine), write every message into its own element, and only proceed if all are empty. Always clear old messages: a fixed form must not keep yesterday’s errors. Validation in JS is for helping people; a real server must check again.',
      ),
      example: 'form.addEventListener("submit", (event) => {\n  event.preventDefault();\n  const name = nameInput.value.trim();\n  error.textContent = name === "" ? "Name is required" : "";\n});\n\nNumber("");    // 0  (careful!)\nNumber("abc"); // NaN\nNumber.isInteger(Number("2.5")); // false\n/^[A-Z]{3}-\\d{2}$/.test("ABC-12"); // true',
    },
    steps: [
      { kind: 'teach', title: 'Two kinds of checking', body: text('The HTML attributes you met earlier (`required`, `min`, `pattern`) let the browser validate for you. When you need your own rules, exact messages, or a check that depends on **two fields together** (like "repeat password"), you write the validation in JavaScript.', 'Watch for two traps: values are strings (so `"10" < "9"` is true when compared as text), and `Number("")` is `0`, which quietly turns an empty box into a valid zero.') },
      webDemo({
        title: 'A form that answers back',
        body: text('Run it, click Send with an empty name, then with a name. Then change it so the name must be at least 3 characters.'),
        files: files(formHtml('contact', [{ id: 'name', label: 'Name' }], 'Send'), '.error { color: #b00020; }\n', 'document.querySelector("#contact").addEventListener("submit", (event) => {\n  event.preventDefault();\n  const name = document.querySelector("#name").value.trim();\n  document.querySelector("#name-error").textContent = name === "" ? "Name is required" : "";\n  document.querySelector("#result").textContent = name === "" ? "" : "Thanks, " + name;\n});\n'),
        notice: 'preventDefault stops the page from being replaced; the messages are written into the page; both the error and the result are reset on every submit.',
      }),
      { kind: 'challenge', challengeId: 'web-20-contact-form' },
      { kind: 'challenge', challengeId: 'web-20-signup-form' },
      { kind: 'challenge', challengeId: 'web-20-note-counter' },
    ],
  },
  objectives: [
    { id: 'js-obj-form-validation', title: 'Validate a form in JavaScript', summary: 'Own the submit event, check several fields (including relationships between them), show exact messages, and clear them when fixed.' },
    { id: 'js-obj-live-input', title: 'React to typing as it happens', summary: 'Use input events to keep counters, hints and enabled/disabled controls in step with what the user has typed.' },
  ],
  challenges: [
    wc({
      id: 'web-20-contact-form', title: 'The Contact Form', mode: 'learning', skillIds: ['js.forms'], concepts: ['submit', 'preventDefault', 'validation'], difficulty: 2, context: 'customer support',
      prompt: text('The form `#contact` has a name and a message. On submit: the page must **not** reload. If the name (trimmed) is empty, `#name-error` says `Name is required`. If the message (trimmed) has fewer than 10 characters, `#message-error` says `Message is too short`. If both are fine, `#result` says `Sent, <name>` (the trimmed name). Otherwise `#result` is empty.'),
      expectedBehavior: 'Messages appear beside the fields that are wrong; a valid form shows the result.',
      guidedSteps: ['Listen for `submit` on the form and call `event.preventDefault()`.', 'Read the two values with `.value.trim()`.', 'Set each error element’s text to a message or an empty string.', 'Set `#result` only when there are no errors.'],
      starterFiles: files(CONTACT_HTML, '.error { color: #b00020; }\n', ''), tabs: ['js'],
      hints: ['The submit event belongs to the form, not the button.', 'Decide each message first, then write them all, then decide the result.', '`event.preventDefault()`, `.trim()`, `.length`, `textContent`.'],
      checks: [
        formCheck('A valid form', '#contact', [{ values: { name: '  Ada ', message: 'Thanks for the quick fix' }, errors: { name: '', message: '' }, result: 'Sent, Ada' }]),
        formCheck('Both fields wrong', '#contact', [{ values: { name: '   ', message: 'short' }, errors: { name: 'Name is required', message: 'Message is too short' }, result: '' }]),
        formCheck('Fixing the form clears the messages', '#contact', [
          { values: { name: '', message: 'x' }, errors: { name: 'Name is required', message: 'Message is too short' }, result: '' },
          { values: { name: 'Bo', message: '0123456789' }, errors: { name: '', message: '' }, result: 'Sent, Bo' },
        ], { visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-20-signup-form', objectiveId: 'js-obj-form-validation', title: 'The Sign-up Form', mode: 'challenge', skillIds: ['js.forms'], concepts: ['submit', 'preventDefault', 'validation', 'regular expressions'], difficulty: 3, context: 'software',
      prompt: text(
        'Make the sign-up form `#signup` work without sending the page anywhere. On submit, each field gets its own message in `#email-error`, `#password-error` and `#confirm-error` (empty when the field is fine):',
        '- **Email** (spaces around it are ignored): some text, one `@`, then text with a dot in it, and no spaces inside → otherwise `Enter a valid email`.\n- **Password**: at least **8** characters and at least one digit → otherwise `At least 8 characters with a number`.\n- **Repeat password** must equal the password → otherwise `Passwords must match`.',
        'When everything is valid `#result` says `Welcome, <email>` (trimmed); otherwise it is empty. Fixing a mistake and submitting again must clear the old messages.',
      ),
      expectedBehavior: 'Per-field messages, a welcome line only when valid, and messages that clear when fixed.',
      starterFiles: files(SIGNUP_HTML, '.error { color: #b00020; }\n', ''), tabs: ['js'],
      hints: ['Compute all three messages before writing any of them.', 'A regular expression can describe the email shape; `/\\d/` finds a digit.', 'Store the messages in an object keyed by field, loop to write them, and check that all of them are empty.'],
      checks: [
        formCheck('A valid sign-up', '#signup', [{ values: { email: 'ada@example.com', password: 'lovelace1', confirm: 'lovelace1' }, errors: E({}), result: OK }]),
        formCheck('A bad email', '#signup', [{ values: { email: 'ada@example', password: 'lovelace1', confirm: 'lovelace1' }, errors: E({ email: 'Enter a valid email' }), result: '' }]),
        formCheck('Password rules', '#signup', [
          { values: { email: 'ada@example.com', password: 'abc1234', confirm: 'abc1234' }, errors: E({ password: 'At least 8 characters with a number' }), result: '' },
          { values: { email: 'ada@example.com', password: 'abcdefgh', confirm: 'abcdefgh' }, errors: E({ password: 'At least 8 characters with a number' }), result: '' },
          { values: { email: 'ada@example.com', password: 'abcdefg1', confirm: 'abcdefg1' }, errors: E({}), result: OK },
        ], { visible: false }),
        formCheck('The passwords must match', '#signup', [{ values: { email: 'ada@example.com', password: 'lovelace1', confirm: 'lovelace2' }, errors: E({ confirm: 'Passwords must match' }), result: '' }]),
        formCheck('Spaces and shapes of email', '#signup', [
          { values: { email: '  ada@example.com  ', password: 'lovelace1', confirm: 'lovelace1' }, errors: E({}), result: OK },
          { values: { email: 'a da@example.com', password: 'lovelace1', confirm: 'lovelace1' }, errors: E({ email: 'Enter a valid email' }), result: '' },
          { values: { email: '@example.com', password: 'lovelace1', confirm: 'lovelace1' }, errors: E({ email: 'Enter a valid email' }), result: '' },
        ], { visible: false }),
        formCheck('Every message at once, then fixed', '#signup', [
          { values: { email: 'nope', password: 'x', confirm: 'y' }, errors: E({ email: 'Enter a valid email', password: 'At least 8 characters with a number', confirm: 'Passwords must match' }), result: '' },
          { values: { email: 'ada@example.com', password: 'lovelace1', confirm: 'lovelace1' }, errors: E({}), result: OK },
        ], { visible: false }),
      ],
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-20-order-form', objectiveId: 'js-obj-form-validation', title: 'The Parts Order Form', mode: 'challenge', skillIds: ['js.forms'], concepts: ['submit', 'preventDefault', 'validation', 'regular expressions'], difficulty: 3, context: 'retail',
      prompt: text(
        'Make the order form `#order` work without leaving the page. On submit, put a message in `#name-error`, `#qty-error` and `#code-error` (empty when fine):',
        '- **Name** (spaces around it ignored) must not be empty → `Name is required`.\n- **Quantity** must be a **whole number from 1 to 99** → `Quantity must be a whole number from 1 to 99`. An empty box is not a valid quantity.\n- **Discount code** is optional, but if something is typed it must be **three capital letters, a dash and two digits** (like `ABC-12`) → `Code looks like ABC-12`.',
        'When all is well, `#result` says `Ordered <qty> for <name>`; otherwise it is empty. Old messages must not survive a corrected resubmit.',
      ),
      starterFiles: files(ORDER_HTML, '.error { color: #b00020; }\n', ''), tabs: ['js'],
      hints: ['Quantity arrives as text; decide what conversion and what tests make “whole number from 1 to 99” true.', 'What does converting an empty string to a number give you?', 'An optional field passes when it is empty OR matches the pattern.'],
      checks: [
        formCheck('A valid order', '#order', [{ values: { name: ' Kim ', qty: '12', code: 'ABC-12' }, errors: { name: '', qty: '', code: '' }, result: 'Ordered 12 for Kim' }]),
        formCheck('The name is required', '#order', [{ values: { name: '  ', qty: '3', code: '' }, errors: { name: 'Name is required', qty: '', code: '' }, result: '' }]),
        formCheck('Quantity rules', '#order', [
          ...['0', '100', '2.5', '', 'abc'].map((q) => ({ values: { name: 'Kim', qty: q, code: '' }, errors: { name: '', qty: 'Quantity must be a whole number from 1 to 99', code: '' }, result: '' })),
          { values: { name: 'Kim', qty: '99', code: '' }, errors: { name: '', qty: '', code: '' }, result: 'Ordered 99 for Kim' },
          { values: { name: 'Kim', qty: '1', code: '' }, errors: { name: '', qty: '', code: '' }, result: 'Ordered 1 for Kim' },
        ], { visible: false }),
        formCheck('The optional code', '#order', [
          { values: { name: 'Kim', qty: '2', code: 'abc-12' }, errors: { name: '', qty: '', code: 'Code looks like ABC-12' }, result: '' },
          { values: { name: 'Kim', qty: '2', code: 'ABC-1' }, errors: { name: '', qty: '', code: 'Code looks like ABC-12' }, result: '' },
          { values: { name: 'Kim', qty: '2', code: '' }, errors: { name: '', qty: '', code: '' }, result: 'Ordered 2 for Kim' },
        ], { visible: false }),
      ],
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-20-sensor-form', objectiveId: 'js-obj-form-validation', title: 'The Sensor Log Form', mode: 'challenge', skillIds: ['js.forms'], concepts: ['submit', 'preventDefault', 'validation', 'regular expressions'], difficulty: 3, context: 'manufacturing',
      prompt: text(
        'Make the log form `#reading` work without leaving the page. On submit, fill `#sensor-error`, `#value-error` and `#note-error` (empty when fine):',
        '- **Sensor** must be `S-` followed by exactly three digits → `Sensor looks like S-123`.\n- **Reading** must be a number from **-50 to 150** inclusive; a blank box is not a reading → `Reading must be from -50 to 150`.\n- **Note** may be empty but is at most **40** characters (after trimming) → `Note is too long (max 40)`.',
        'When valid, `#result` says `Logged <sensor>: <reading>` where the reading is shown as the number (so `" 7.50 "` shows as `7.5`); otherwise it is empty.',
      ),
      starterFiles: files(SENSOR_HTML, '.error { color: #b00020; }\n', ''), tabs: ['js'],
      hints: ['Three independent rules; each yields a message or an empty string.', 'Blank and text are the traps when converting to a number.', 'A range check plus a check that the conversion actually produced a number.'],
      checks: [
        formCheck('A valid reading', '#reading', [{ values: { sensor: 'S-104', value: ' 7.50 ', note: 'calibrated' }, errors: { sensor: '', value: '', note: '' }, result: 'Logged S-104: 7.5' }]),
        formCheck('Sensor ids', '#reading', ['s-104', 'S-10', 'S-1044', 'S104', ''].map((s) => ({ values: { sensor: s, value: '20', note: '' }, errors: { sensor: 'Sensor looks like S-123', value: '', note: '' }, result: '' })), { visible: false }),
        formCheck('Reading limits', '#reading', [
          ...['150.1', '-50.5', '', 'hot'].map((v) => ({ values: { sensor: 'S-104', value: v, note: '' }, errors: { sensor: '', value: 'Reading must be from -50 to 150', note: '' }, result: '' })),
          { values: { sensor: 'S-104', value: '-50', note: '' }, errors: { sensor: '', value: '', note: '' }, result: 'Logged S-104: -50' },
          { values: { sensor: 'S-104', value: '150', note: '' }, errors: { sensor: '', value: '', note: '' }, result: 'Logged S-104: 150' },
          { values: { sensor: 'S-104', value: '0', note: '' }, errors: { sensor: '', value: '', note: '' }, result: 'Logged S-104: 0' },
        ], { visible: false }),
        formCheck('The note limit', '#reading', [
          { values: { sensor: 'S-104', value: '20', note: 'x'.repeat(41) }, errors: { sensor: '', value: '', note: 'Note is too long (max 40)' }, result: '' },
          { values: { sensor: 'S-104', value: '20', note: 'x'.repeat(40) }, errors: { sensor: '', value: '', note: '' }, result: 'Logged S-104: 20' },
        ], { visible: false }),
      ],
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-20-note-counter', objectiveId: 'js-obj-live-input', title: 'The Ticket Note Counter', mode: 'challenge', skillIds: ['js.forms'], concepts: ['input event', 'state', 'disabled'], difficulty: 3, context: 'customer support',
      prompt: text('A support note box `#note` allows at most **80** characters. As the person types, `#left` always shows how many characters are left as `N left` (it goes negative if they go over, e.g. `-3 left`) and gets the class `over` **only** while they are over the limit. The button `#send` is disabled while the note is empty or only spaces, or over the limit, and enabled otherwise. Spaces count as characters.'),
      starterFiles: files('<textarea id="note" rows="4" cols="40"></textarea>\n<p id="left">80 left</p>\n<button id="send" disabled>Send</button>\n', '.over { color: #b00020; }\n', ''), tabs: ['js'],
      hints: ['The event that fires on every keystroke is not `change`.', 'One function computes everything from the current text.', 'Use the length of the text, and `classList.toggle(name, condition)` for the class.'],
      checks: [
        web('The counter follows typing', "h.type('#note', 'Machine down'); h.eq(h.text('#left'), '68 left'); h.assert(!h.$('#send').disabled, 'Send is enabled once there is text.'); h.assert(!h.$('#left').classList.contains('over')); h.type('#note', ''); h.eq(h.text('#left'), '80 left'); h.assert(h.$('#send').disabled, 'Send is disabled when the note is empty.');"),
        web('The limit', "h.type('#note', 'x'.repeat(80)); h.eq(h.text('#left'), '0 left'); h.assert(!h.$('#left').classList.contains('over'), 'Exactly 80 is allowed.'); h.assert(!h.$('#send').disabled, 'Exactly 80 can be sent.'); h.type('#note', 'x'.repeat(83)); h.eq(h.text('#left'), '-3 left'); h.assert(h.$('#left').classList.contains('over')); h.assert(h.$('#send').disabled, 'Over the limit cannot be sent.'); h.type('#note', 'x'.repeat(79)); h.assert(!h.$('#left').classList.contains('over'), 'The class goes away again.'); h.assert(!h.$('#send').disabled);", { visible: false }),
        web('Spaces', "h.type('#note', '     '); h.assert(h.$('#send').disabled, 'Only spaces is not a note.'); h.eq(h.text('#left'), '75 left', 'Spaces count as characters'); h.type('#note', '  hi  '); h.assert(!h.$('#send').disabled); h.eq(h.text('#left'), '74 left');", { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-20-username-check', objectiveId: 'js-obj-live-input', title: 'The Player Name Checker', mode: 'challenge', skillIds: ['js.forms'], concepts: ['input event', 'state', 'disabled'], difficulty: 3, context: 'games',
      prompt: text(
        'As a player types a name into `#user`, the paragraph `#hint` says what is wrong, using the **first** rule that applies:',
        '1. empty → nothing (empty text)\n2. any character other than letters, digits or `_` → `Letters, numbers and _ only`\n3. fewer than 3 characters → `Too short`\n4. more than 12 characters → `Too long`\n5. `admin`, `root` or `system` in any capitals → `Taken`\n6. otherwise → `Available`',
        '`#hint` has the class `ok` only when it says `Available`. `#join` is enabled only when the name is available.',
      ),
      starterFiles: files('<label>Player name <input id="user" autocomplete="off"></label>\n<p id="hint"></p>\n<button id="join" disabled>Join</button>\n', '.ok { color: #1b7f3b; }\n', ''), tabs: ['js'],
      hints: ['Turn the rules into one function from the current text to a message.', 'The order of the rules matters: check them top to bottom.', 'A regular expression can test the allowed characters; compare reserved names after lower-casing.'],
      checks: [
        web('Typical names', "const tries = [['ab', 'Too short'], ['ada_99', 'Available'], ['a-b', 'Letters, numbers and _ only'], ['Admin', 'Taken'], ['', '']]; for (const [name, msg] of tries) { h.type('#user', name); h.eq(h.text('#hint'), msg, 'For \"' + name + '\"'); h.eq(h.$('#hint').classList.contains('ok'), msg === 'Available'); h.eq(h.$('#join').disabled, msg !== 'Available'); }"),
        web('The boundaries', "const tries = [['abc', 'Available'], ['a'.repeat(12), 'Available'], ['a'.repeat(13), 'Too long'], ['ab', 'Too short'], ['ROOT', 'Taken'], ['System', 'Taken'], ['sys', 'Available']]; for (const [name, msg] of tries) { h.type('#user', name); h.eq(h.text('#hint'), msg, 'For \"' + name + '\"'); h.eq(h.$('#join').disabled, msg !== 'Available', 'Join for \"' + name + '\"'); }", { visible: false }),
        web('Rule order', "h.type('#user', 'a!'); h.eq(h.text('#hint'), 'Letters, numbers and _ only', 'Bad characters are reported before length'); h.type('#user', 'a b c d e f g h i j k'); h.eq(h.text('#hint'), 'Letters, numbers and _ only');", { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
  ],
};
