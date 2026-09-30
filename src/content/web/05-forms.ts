import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/** Every control (input/select/textarea, excluding buttons) must have an accessible label. */
const LABELLED = "const ctl = h.$$('input:not([type=submit]):not([type=button]):not([type=hidden]), select, textarea'); h.assert(ctl.length > 0, 'The form needs controls.'); ctl.forEach((c) => h.assert(h.labelText(c).length > 1, 'Every control needs a visible label connected to it (for/id, or wrapping the control).'));";

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-05-forms', title: 'Forms and Validation', language: 'web', skillId: 'web.forms',
    blurb: 'Labels, input types, choices, and letting the browser validate.', prerequisites: ['web-04-semantics'], xpReward: 55,
    reference: {
      title: 'HTML forms and validation',
      body: text(
        '`<form>` groups controls. Every control needs a **`<label>`** connected to it: `<label for="email">Email</label><input id="email" name="email">` (or wrap the input inside the label). `name` is the key the data is sent under.',
        'Input types: `text`, `email`, `number` (with `min`/`max`/`step`), `checkbox`, `radio` (same `name` = one choice; group with `<fieldset><legend>`), `date`; plus `<select><option>` and `<textarea>`. **Validation attributes** make the browser check for you: `required`, `minlength`/`maxlength`, `min`/`max`, `pattern="[0-9]{6}"`, and the type itself (`type="email"`). A form with an invalid control does not submit.',
      ),
      example: '<form>\n  <label for="id">Student ID</label>\n  <input id="id" name="id" pattern="[0-9]{6}" required>\n  <button>Send</button>\n</form>',
    },
    steps: [
      { kind: 'teach', title: 'Forms are how the web listens', body: text('Everything so far was one-way: you told the browser what to show. **Forms** let visitors tell *you* something: a sign-up, a maintenance request, a search. That makes two things matter: people must understand each field (**labels**), and the data must be sensible (**validation**).', 'Good news: browsers can check a lot for you. Attributes like `required`, `type="email"`, `min`, `max` and `pattern` are validation with no JavaScript, and they work with keyboards and screen readers.') },
      webDemo({
        title: 'A form the browser validates',
        body: text('Run it, then press the button with the field empty, then with a bad address, then with a good one. (The page is sandboxed, so nothing is actually sent.)'),
        files: files('<form>\n  <label for="email">Email address</label>\n  <input id="email" name="email" type="email" required>\n  <button>Subscribe</button>\n</form>\n'),
        notice: 'You wrote no code to block the empty or malformed address: `required` and `type="email"` did it. Note the `label` connected with `for`/`id`: clicking the label focuses the field, and a screen reader announces it.',
      }),
      { kind: 'challenge', challengeId: 'web-05-contact-form' },
      { kind: 'challenge', challengeId: 'web-05-maintenance-request' },
    ],
  },
  objectives: [{ id: 'web-obj-forms-validation', title: 'Build a labelled form the browser validates', summary: 'Labels, the right control types, fieldset/legend, and required/min/max/pattern/length attributes.' }],
  challenges: [
    wc({
      id: 'web-05-contact-form', title: 'The Contact Form', mode: 'learning', skillIds: ['web.forms'], concepts: ['label', 'input types', 'required', 'textarea'], difficulty: 2, context: 'business',
      prompt: text('Build a contact form with a **Name** (text), an **Email** (an email address) and a **Message** (several lines), all required, and a submit button labelled `Send`. Every field needs a label.'),
      expectedBehavior: 'A form the browser refuses to submit until name, a valid email and a message are given.',
      guidedSteps: ['A `<form>` element around everything.', 'For each field: a `<label for="...">` and a control with the matching `id` and a `name`.', 'Types: text, email, and a `<textarea>`.', 'Add `required` to each.'],
      starterFiles: files('<h1>Contact us</h1>\n'), tabs: ['html'],
      hints: ['Each field is a label plus a control, connected.', 'The kind of control decides the built-in checking: an email box knows what an email looks like.', '`type="email"`, `<textarea>`, and the attribute that makes a field compulsory.'],
      checks: [
        web('One form with a submit button', "h.eq(h.$$('form').length, 1); h.assert(h.exists('form button, form input[type=submit]'), 'Add a submit button inside the form.'); const b = h.$('form button, form input[type=submit]'); h.eq(h.norm(b.textContent || b.value), 'Send');"),
        web('Three labelled controls of the right kind', `${LABELLED}\nh.assert(h.exists('input[type=email]'), 'Use an email input.'); h.assert(h.exists('textarea'), 'Use a textarea for the message.'); h.assert(h.$$('input:not([type=email]):not([type=submit]):not([type=button])').some((i) => !i.type || i.type === 'text'), 'Use a text input for the name.'); h.eq(h.$$('input, textarea').length, 3);`),
        web('The browser refuses bad data', "const s0 = h.submit('form'); h.assert(!s0.valid && !s0.fired, 'An empty form must not submit.'); h.type('input[type=email]', 'not-an-email'); h.assert(!h.submit('form').fired, 'A malformed email must not submit.'); h.$$('input:not([type=email]):not([type=submit]):not([type=button])').forEach((i) => h.type(i, 'Ada')); h.type('input[type=email]', 'ada@example.com'); h.assert(!h.submit('form').fired, 'The message is required too.'); h.type('textarea', 'Hello'); const ok = h.submit('form'); h.assert(ok.valid, 'A complete form should be valid.');"),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-05-maintenance-request', objectiveId: 'web-obj-forms-validation', title: 'Maintenance Request', mode: 'challenge', skillIds: ['web.forms'], concepts: ['label', 'input types', 'required', 'textarea', 'fieldset'], difficulty: 3, context: 'maintenance',
      prompt: text('A factory wants a maintenance-request form with: a **Machine** chosen from `Press`, `Lathe`, `Welder` (with an unselected first option, and a choice is required); a **Priority** of `Low`, `Medium` or `High` (exactly one, required, presented as a group with a group label `Priority`); a **Description** of at least 10 characters (required); and a `Submit request` button. Every control needs a label.'),
      expectedBehavior: 'A form that refuses to submit without a machine, a priority and a 10+ character description.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Different questions need different controls: a fixed list, one-of-three, and free text.', 'A set of related radio buttons shares one thing, and gets a group label.', '`select` with a first empty option, radios with one `name` inside `fieldset`/`legend`, `minlength` on the textarea.'],
      checks: [
        web('The form and its button', "h.eq(h.$$('form').length, 1); const b = h.$('form button, form input[type=submit]'); h.assert(b, 'Add a submit button.'); h.eq(h.norm(b.textContent || b.value), 'Submit request');"),
        web('Machine list', "const s = h.$('select'); h.assert(s, 'Use a select for the machine.'); const o = Array.from(s.options); h.eq(o.slice(1).map((x) => h.norm(x.textContent)), ['Press', 'Lathe', 'Welder']); h.eq(o[0].value, '', 'The first option is a placeholder with an empty value'); h.assert(s.required, 'A machine must be chosen.');"),
        web('Priority is a labelled group of three radios', "const r = h.$$('input[type=radio]'); h.eq(r.length, 3); h.eq(new Set(r.map((x) => x.name)).size, 1, 'One name so only one can be chosen'); h.eq(r.map((x) => h.labelText(x)).sort(), ['High', 'Low', 'Medium']); const fs = h.$('fieldset'); h.assert(fs && fs.contains(r[0]) && fs.contains(r[2]), 'Group the radios in a fieldset'); h.eq(h.norm(fs.querySelector('legend').textContent), 'Priority');"),
        web('Everything is labelled', LABELLED, { visible: false }),
        web('The browser enforces the rules', "const set = { m: () => h.select('select', 'Press'), p: () => h.click('input[type=radio]'), d: (v) => h.type('textarea', v) }; h.assert(!h.submit('form').fired, 'Empty form must not submit.'); set.m(); set.p(); h.eq(h.$('textarea').getAttribute('minlength'), '10', 'The description must be at least 10 characters (minlength)'); set.d('Hydraulic leak at the base'); h.assert(h.submit('form').valid, 'A full request should be valid.'); h.select('select', ''); h.assert(!h.submit('form').valid, 'The machine is required.');", { visible: false }),
        web('Priority is required', "h.select('select', 'Lathe'); h.type('textarea', 'A long enough description'); h.assert(!h.submit('form').valid, 'Choosing a priority must be required.'); h.click('input[type=radio]'); h.assert(h.submit('form').valid);", { visible: false }),
      ],
      xpReward: 85, coinReward: 12,
    }),
    wc({
      id: 'web-05-course-signup', objectiveId: 'web-obj-forms-validation', title: 'Course Sign-up', mode: 'challenge', skillIds: ['web.forms'], concepts: ['label', 'input types', 'required', 'textarea', 'fieldset'], difficulty: 3, context: 'education',
      prompt: text('A college needs a sign-up form with: a **Student ID** of exactly 6 digits (required); an **Email** (required); a **Year** of study, a whole number from 1 to 4 (required); a checkbox labelled `I accept the course rules` that must be ticked; and a `Sign up` button. Every control needs a label, and the browser (not JavaScript) must enforce all of it.'),
      expectedBehavior: 'A form that refuses to submit unless every rule is met.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Each rule maps to an attribute or an input type.', 'A pattern describes exactly which characters are allowed; a number input has limits.', '`pattern`, `type="number"` with `min`/`max`, and `required` on the checkbox too.'],
      checks: [
        web('The form and its button', "h.eq(h.$$('form').length, 1); const b = h.$('form button, form input[type=submit]'); h.assert(b, 'Add a submit button.'); h.eq(h.norm(b.textContent || b.value), 'Sign up');"),
        web('Controls are labelled', LABELLED),
        web('The rules', "const fill = (id, mail, year, agree) => { h.type('input:not([type=email]):not([type=number]):not([type=checkbox]):not([type=submit]):not([type=button])', id); h.type('input[type=email]', mail); h.type('input[type=number]', year); h.check('input[type=checkbox]', agree); return h.submit('form'); }; h.assert(fill('123456', 'a@b.co', '2', true).valid, 'A complete valid form should submit.'); h.assert(!fill('12345', 'a@b.co', '2', true).valid, 'A 5-digit ID must be refused.'); h.assert(!fill('1234567', 'a@b.co', '2', true).valid, 'A 7-digit ID must be refused.'); h.assert(!fill('12345a', 'a@b.co', '2', true).valid, 'Letters are not allowed in the ID.'); h.assert(!fill('123456', 'nope', '2', true).valid, 'A bad email must be refused.'); h.assert(!fill('123456', 'a@b.co', '5', true).valid, 'Year 5 does not exist.'); h.assert(!fill('123456', 'a@b.co', '0', true).valid, 'Year 0 does not exist.'); h.assert(!fill('123456', 'a@b.co', '', true).valid, 'The year is required.'); h.assert(!fill('123456', 'a@b.co', '3', false).valid, 'The rules must be accepted.'); h.assert(fill('000001', 'z@z.zz', '4', true).valid, 'Boundary values are fine.'); h.assert(fill('123456', 'a@b.co', '1', true).valid);", { visible: false }),
        web('The checkbox label', "h.eq(h.labelText('input[type=checkbox]'), 'I accept the course rules');", { visible: false }),
      ],
      xpReward: 85, coinReward: 12,
    }),
    wc({
      id: 'web-05-race-entry', objectiveId: 'web-obj-forms-validation', title: 'Race Entry Form', mode: 'challenge', skillIds: ['web.forms'], concepts: ['label', 'input types', 'required', 'textarea', 'fieldset'], difficulty: 3, context: 'motorsport',
      prompt: text('A racing club needs an entry form with: **Driver name** (required, at most 30 characters); **Car number**, a whole number from 1 to 99 (required); **Class**, one of `Open`, `Pro`, `Junior` (required, with an unselected first option); **Notes** (optional, at most 200 characters); a checkbox `I hold a valid licence` that must be ticked; and an `Enter race` button. Every control needs a label, and the browser must enforce it all.'),
      expectedBehavior: 'A form that refuses to submit unless every rule is met; Notes is optional.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['List each field with its rule, then choose the control and attributes.', 'Limits on length and on numbers are attributes; a required choice from a list needs a placeholder option.', '`maxlength`, `min`/`max`, `required`, and notice that Notes has no `required`.'],
      checks: [
        web('The form and its button', "h.eq(h.$$('form').length, 1); const b = h.$('form button, form input[type=submit]'); h.assert(b, 'Add a submit button.'); h.eq(h.norm(b.textContent || b.value), 'Enter race');"),
        web('Controls are labelled', LABELLED),
        web('The rules', "const TXT = 'input:not([type=number]):not([type=checkbox]):not([type=submit]):not([type=button])'; const go = (name, num, cls, notes, lic) => { h.type(TXT, name); h.type('input[type=number]', num); h.select('select', cls); h.type('textarea', notes); h.check('input[type=checkbox]', lic); return h.submit('form'); }; h.assert(go('Ada Reyes', '7', 'Pro', '', true).valid, 'A valid entry (notes empty) must submit.'); h.assert(go('Ada Reyes', '7', 'Pro', 'x'.repeat(200), true).valid, '200 characters of notes are allowed.'); go('Ada Reyes', '7', 'Pro', 'x'.repeat(201), true); h.assert(h.$('textarea').value.length <= 200, 'Notes are limited to 200 characters.'); h.assert(!go('', '7', 'Pro', '', true).valid, 'The name is required.'); h.assert(go('N'.repeat(30), '7', 'Open', '', true).valid, '30 characters of name are allowed.'); go('N'.repeat(31), '7', 'Open', '', true); h.assert(h.$(TXT).value.length <= 30, 'Names are limited to 30 characters.'); h.assert(!go('Ada Reyes', '100', 'Pro', '', true).valid, 'Car 100 does not exist.'); h.assert(!go('Ada Reyes', '0', 'Pro', '', true).valid, 'Car 0 does not exist.'); h.assert(!go('Ada Reyes', '', 'Pro', '', true).valid, 'The car number is required.'); h.assert(!go('Ada Reyes', '7', '', '', true).valid, 'The class is required.'); h.assert(!go('Ada Reyes', '7', 'Pro', '', false).valid, 'The licence must be confirmed.');", { visible: false }),
        web('Class options', "const o = Array.from(h.$('select').options); h.eq(o.slice(1).map((x) => h.norm(x.textContent)), ['Open', 'Pro', 'Junior']); h.eq(o[0].value, '');", { visible: false }),
      ],
      xpReward: 85, coinReward: 12,
    }),
  ],
};
