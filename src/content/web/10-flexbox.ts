import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const near = (a: string, b: string, why: string) => `h.assert(Math.abs((${a}) - (${b})) <= 1.5, ${JSON.stringify(why)} + ' (got ' + Math.round((${a}) * 10) / 10 + ')');`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-10-flexbox', title: 'Flexbox: Layout in One Direction', language: 'web', skillId: 'web.layout',
    blurb: 'Rows and columns of flexible boxes: main axis, cross axis, gap, growing and pushing.', prerequisites: ['web-09-box-model'], xpReward: 55,
    reference: {
      title: 'Flexbox',
      body: text(
        'Set `display: flex` on a **container** and its children become **flex items** laid out along the **main axis** (`flex-direction: row|column`). `justify-content` distributes items along the main axis (`flex-start`, `center`, `space-between`, `space-around`); `align-items` aligns them across (`stretch`, `center`, `flex-start`); `gap` puts space between items; `flex-wrap: wrap` lets them wrap onto more lines.',
        'On an **item**: `flex: 1` makes it share the free space equally with other `flex: 1` items; `flex: none` keeps its own size; `margin-left: auto` pushes it (and everything after it) to the far end; `align-self` overrides alignment for one item.',
      ),
      example: '.bar { display: flex; align-items: center; gap: 16px; }\n.bar .login { margin-left: auto; }',
    },
    steps: [
      { kind: 'teach', title: 'Laying things out in a line', body: text('Before flexbox, putting three things in a row and centring them was famously painful. Flexbox is a layout mode designed for exactly that: **distributing space along one direction**. You describe the *intent* (space them out, centre them, let this one grow) and the browser does the arithmetic, even when the screen size changes.', 'Two axes: the **main axis** is the direction items flow (a row by default); the **cross axis** is perpendicular. Most properties are about one axis or the other, so think “which axis is this about?” first.') },
      webDemo({
        title: 'Play with a flex container',
        body: text('Run it. Then try `justify-content: space-between`, `align-items: center`, `flex-direction: column`, and giving `.b` `flex: 1`.'),
        files: files('<div class="row"><div>A</div><div class="b">B</div><div>C</div></div>\n', '.row { display: flex; gap: 8px; height: 100px; background: #eee; }\n.row div { background: #9bd; padding: 8px; }\n'),
        notice: 'Changing the container’s properties moves ALL the items; changing an item’s `flex` changes only its share of the free space. `gap` is the modern way to space items (no margin arithmetic).',
      }),
      { kind: 'challenge', challengeId: 'web-10-nav-bar' },
      { kind: 'challenge', challengeId: 'web-10-toolbar' },
    ],
  },
  objectives: [{ id: 'web-obj-flexbox', title: 'Arrange items with flexbox', summary: 'Direction, alignment, gap, growing and pushing items, verified by measuring positions.' }],
  challenges: [
    wc({
      id: 'web-10-nav-bar', title: 'The Navigation Bar', mode: 'learning', skillIds: ['web.layout'], concepts: ['flexbox', 'align-items', 'gap', 'margin auto'], difficulty: 2, context: 'business',
      prompt: text('Turn `.bar` into a horizontal navigation bar: the links sit in a row with 16px between them and are **vertically centred** in the 80px-high bar; the `Log in` link is pushed to the far right end of the bar while the others stay at the left.'),
      expectedBehavior: 'Three links on the left with equal gaps, vertically centred, and Log in on the far right.',
      guidedSteps: ['`display: flex;` on `.bar`.', '`align-items: center;` centres across the row, `gap: 16px;` spaces the items.', 'An automatic margin on the left of `.login` absorbs all the free space.'],
      starterFiles: files('<nav class="bar">\n  <a href="#">Home</a>\n  <a href="#">Machines</a>\n  <a href="#">Reports</a>\n  <a href="#" class="login">Log in</a>\n</nav>\n', '.bar { height: 80px; background: #eeeeee; }\n.bar a { padding: 0; }\n'), tabs: ['css'],
      hints: ['Which element needs to become a flex container?', 'Spacing between items and alignment across the row are container properties.', 'To push one item to the end, give it an automatic margin on the side facing the free space.'],
      checks: [
        web('A flex row', "h.eq(h.style('.bar', 'display'), 'flex'); const a = h.$$('.bar a').map((x) => x.getBoundingClientRect()); h.assert(a.every((r) => Math.abs(r.top - a[0].top) < 2), 'The links sit in one row.');"),
        web('Gaps and order', `const a = h.$$('.bar a').map((x) => x.getBoundingClientRect()); ${near('a[1].left - a[0].right', '16', 'The gap between links is 16px')}; ${near('a[2].left - a[1].right', '16', 'The gap between links is 16px')}; h.assert(a[0].left < a[1].left && a[1].left < a[2].left);`),
        web('Vertically centred', `const b = h.rect('.bar'); h.$$('.bar a').forEach((x) => { const r = h.textRect(x); ${near('r.top + r.h / 2', 'b.top + b.h / 2', 'The link text is vertically centred in the bar')}; });`),
        web('Log in at the far right', `const b = h.rect('.bar'); const l = h.rect('.login'); ${near('l.right', 'b.right', 'Log in touches the right end of the bar')}; h.assert(h.rect('.bar a:nth-child(3)').right < l.left - 20, 'The other links stay on the left.');`, { visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-10-toolbar', objectiveId: 'web-obj-flexbox', title: 'The Control Toolbar', mode: 'challenge', skillIds: ['web.layout'], concepts: ['flexbox', 'align-items', 'gap', 'flex grow'], difficulty: 3, context: 'engineering',
      prompt: text('A control panel has a toolbar (`.toolbar`, 600px wide) with four buttons. They must sit in one row with 8px between them, and **share the whole width equally**, so all four are the same width and together fill the toolbar exactly. The buttons are 48px tall; the toolbar itself may be as tall as it needs to be.'),
      expectedBehavior: 'Four equal-width buttons filling the toolbar with 8px gaps.',
      starterFiles: files('<div class="toolbar">\n  <button>Start</button>\n  <button>Stop</button>\n  <button>Reset</button>\n  <button>Alarm</button>\n</div>\n', '.toolbar { width: 600px; background: #ddd; }\n.toolbar button { height: 48px; padding: 0; border: 0; }\n'), tabs: ['css'],
      hints: ['Buttons in a row is a job for flexbox.', 'Free space can be shared out among items.', '`flex: 1` on each item, and `gap` on the container.'],
      checks: [
        web('A row of four', "const b = h.$$('.toolbar button').map((x) => x.getBoundingClientRect()); h.eq(b.length, 4); h.assert(b.every((r) => Math.abs(r.top - b[0].top) < 2), 'One row.');"),
        web('Equal widths that fill the toolbar', `const t = h.rect('.toolbar'); const b = h.$$('.toolbar button').map((x) => x.getBoundingClientRect()); b.forEach((r) => { ${near('r.width', '(600 - 3 * 8) / 4', 'Each button is (600 - 3 gaps) / 4 wide')}; }); ${near('b[3].right', 't.right', 'The last button reaches the right edge')}; ${near('b[0].left', 't.left', 'The first button starts at the left edge')};`),
        web('Gaps', `const b = h.$$('.toolbar button').map((x) => x.getBoundingClientRect()); for (let i = 1; i < 4; i++) ${near('b[i].left - b[i - 1].right', '8', 'The gap is 8px')};`, { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-10-player-card', objectiveId: 'web-obj-flexbox', title: 'The Player Card', mode: 'challenge', skillIds: ['web.layout'], concepts: ['flexbox', 'align-items', 'gap', 'flex grow'], difficulty: 3, context: 'sports',
      prompt: text('A player card (`.player`, 500px wide) shows a 96x96 photo box on the left and the player’s details to its right. The photo box must keep its size (it must not shrink or stretch), the details take **all the remaining width**, there is 12px between them, and both are aligned to the top of the card.'),
      expectedBehavior: 'A fixed-size photo box on the left, details filling the rest with a 12px gap, both top-aligned.',
      starterFiles: files('<div class="player">\n  <div class="photo">photo</div>\n  <div class="info">\n    <h3>Ada Reyes</h3>\n    <p>Owls · Shortstop · .312 avg</p>\n  </div>\n</div>\n', '.player { width: 500px; background: #eef; }\n.photo { width: 96px; height: 96px; background: #99a; }\n.info h3, .info p { margin: 0; }\n'), tabs: ['css'],
      hints: ['Two things side by side, one fixed, one flexible.', 'The fixed one must refuse to shrink; the flexible one takes what is left.', 'A flex container with `gap`, `align-items: flex-start`, the photo with `flex: none`, the info with `flex: 1`.'],
      checks: [
        web('Side by side and top-aligned', "const p = h.rect('.photo'); const i = h.rect('.info'); h.assert(i.left > p.right - 1, 'The details sit to the right of the photo.'); h.assert(Math.abs(p.top - h.rect('.player').top) < 2 && Math.abs(i.top - h.rect('.player').top) < 2, 'Both are aligned to the top of the card.');"),
        web('The photo keeps its size', "const p = h.rect('.photo'); h.assert(Math.abs(p.w - 96) < 1 && Math.abs(p.h - 96) < 1, 'The photo box stays 96 by 96 (got ' + p.w + ' by ' + p.h + ').');"),
        web('Details fill the rest', `const c = h.rect('.player'); const p = h.rect('.photo'); const i = h.rect('.info'); ${near('i.left - p.right', '12', 'The gap is 12px')}; ${near('i.right', 'c.right', 'The details reach the right edge')};`, { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-10-pit-steps', objectiveId: 'web-obj-flexbox', title: 'Pit Stop Steps', mode: 'challenge', skillIds: ['web.layout'], concepts: ['flexbox', 'align-items', 'gap', 'flex grow'], difficulty: 3, context: 'motorsport',
      prompt: text('A pit-stop timeline (`.steps`, 600px wide, 100px tall) shows three steps, each exactly 120px wide. They sit in a row with the **first at the very left, the last at the very right and the middle one exactly halfway**, and all three are **vertically centred** in the timeline.'),
      expectedBehavior: 'Three fixed-width steps spread evenly across the timeline and centred vertically.',
      starterFiles: files('<div class="steps">\n  <div class="step">Tyres off</div>\n  <div class="step">Refuel</div>\n  <div class="step">Tyres on</div>\n</div>\n', '.steps { width: 600px; height: 100px; background: #222; }\n.step { width: 120px; height: 40px; background: #f39c12; }\n'), tabs: ['css'],
      hints: ['Three items in a row with space distributed between them.', 'One property spreads items along the main axis; another centres them across.', '`justify-content: space-between` and `align-items: center`.'],
      checks: [
        web('Even spread', `const c = h.rect('.steps'); const s = h.$$('.step').map((x) => x.getBoundingClientRect()); ${near('s[0].left', 'c.left', 'The first step is at the left edge')}; ${near('s[2].right', 'c.right', 'The last step is at the right edge')}; ${near('s[1].left + s[1].width / 2', 'c.left + c.w / 2', 'The middle step is halfway')};`),
        web('Centred vertically', `const c = h.rect('.steps'); h.$$('.step').forEach((x) => { const r = x.getBoundingClientRect(); ${near('r.top + r.height / 2', 'c.top + c.h / 2', 'Steps are vertically centred')}; });`),
        web('Steps keep their width', "h.$$('.step').forEach((x) => h.assert(Math.abs(x.getBoundingClientRect().width - 120) < 1, 'Each step stays 120px wide.'));", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
  ],
};
