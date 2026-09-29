import type { Area, AchievementDef, Item, Quest } from './schema';

/**
 * The world map. Unlock rules are data: a new phase ships by adding lessons and changing an
 * area's `lock` from `future` to a real rule. Positions are percentages of the map box.
 */
export const areas: Area[] = [
  {
    id: 'academy', name: 'Bytehaven Academy', icon: '🏰', theme: 'academy', pos: { x: 50, y: 62 },
    tagline: 'Where every adventurer begins',
    description: 'The old stone academy at the heart of Bytehaven. Mentor Juno teaches here, and you can rest to recover your Focus.',
    lock: { type: 'none' },
  },
  {
    id: 'training-grounds', name: 'Training Grounds', icon: '🤖', theme: 'grounds', pos: { x: 24, y: 70 },
    tagline: 'Learn by doing — the robot needs you',
    description: 'A muddy field of practice dummies and one very broken training robot. This is where you write real Python.',
    lock: { type: 'questAccepted', questId: 'wake-the-robot', reason: 'Speak to Mentor Juno at the Academy first.' },
  },
  {
    id: 'library', name: 'Great Library', icon: '📚', theme: 'library', pos: { x: 72, y: 76 },
    tagline: 'Your notes, your record',
    description: 'Look up what you have learned, and see the honest record of what you have actually demonstrated.',
    lock: { type: 'lesson', lessonId: 'py-01-first-program', reason: 'Finish your first lesson to earn a library card.' },
  },
  {
    id: 'shop', name: 'Bolt & Barrel Shop', icon: '🛒', theme: 'shop', pos: { x: 86, y: 56 },
    tagline: 'Spend your hard-earned coins',
    description: 'Snacks, tea, and a few things for the well-dressed adventurer. Nothing here sells answers.',
    lock: { type: 'lesson', lessonId: 'py-02-fixing-errors', reason: 'Finish “Reading the Robot’s Complaints” to be introduced to the shopkeeper.' },
  },
  {
    id: 'data-center', name: 'Data Center', icon: '🗄️', theme: 'data', pos: { x: 64, y: 36 },
    tagline: 'Tables, queries, and vast archives',
    description: 'A humming vault of servers where SQL and databases live.',
    lock: { type: 'future', phase: 3, reason: 'Sealed. Opens in a future update (Phase 3: SQL & databases).' },
  },
  {
    id: 'web-workshop', name: 'Web Workshop', icon: '🌐', theme: 'web', pos: { x: 34, y: 38 },
    tagline: 'Build things people can click',
    description: 'A workshop of half-built websites: HTML, CSS, JavaScript, and APIs.',
    lock: { type: 'future', phase: 4, reason: 'Under construction. Opens in a future update (Phase 4: the web).' },
  },
  {
    id: 'observatory', name: 'Analytics Observatory', icon: '🔭', theme: 'observatory', pos: { x: 14, y: 40 },
    tagline: 'Find the story inside the numbers',
    description: 'Data analysis, statistics, R, and spreadsheets.',
    lock: { type: 'future', phase: 5, reason: 'The lens is still being ground. Opens in a future update (Phase 5).' },
  },
  {
    id: 'summit', name: 'The Summit', icon: '🏔️', theme: 'summit', pos: { x: 48, y: 14 },
    tagline: 'Original projects, no map provided',
    description: 'The final ascent: open-ended projects across every technology you have learned.',
    lock: { type: 'future', phase: 6, reason: 'The path is not yet cut. Opens after the core curriculum.' },
  },
];

/** Nothing here sells answers, hints, or XP. Items only restore Focus or decorate the avatar. */
export const items: Item[] = [
  { id: 'study-snack', name: 'Study Snack', icon: '🍪', kind: 'consumable', price: 10, restoreFocus: 20, description: 'Restores 20 Focus.' },
  { id: 'focus-tea', name: 'Focus Tea', icon: '🍵', kind: 'consumable', price: 25, restoreFocus: 50, description: 'Restores 50 Focus.' },
  { id: 'explorer-cape', name: 'Explorer’s Cape', icon: '🧣', kind: 'cosmetic', price: 80, description: 'A red cape. Purely stylish; worn automatically.' },
  { id: 'lucky-cap', name: 'Lucky Cap', icon: '🧢', kind: 'cosmetic', price: 60, description: 'A well-worn ball cap. Purely stylish; worn automatically.' },
  { id: 'robot-bolt', name: 'Bolt’s Bolt', icon: '🔩', kind: 'quest', price: null, description: 'A shiny bolt Bolt-7 gave you for waking him up.' },
];

export const quests: Quest[] = [
  {
    id: 'wake-the-robot',
    title: 'Wake the Training Robot',
    giver: 'Mentor Juno',
    summary: 'Bolt-7, the Academy’s training robot, cannot move: his control program is incomplete. Learn enough Python to finish it.',
    objectives: [
      { id: 'o1', text: 'Write your first program', lessonId: 'py-01-first-program' },
      { id: 'o2', text: 'Learn to read error messages', lessonId: 'py-02-fixing-errors' },
      { id: 'o3', text: 'Give Bolt a memory (variables)', lessonId: 'py-03-variables' },
      { id: 'o4', text: 'Teach Bolt to talk (strings)', lessonId: 'py-04-strings' },
      { id: 'o5', text: 'Install Bolt’s calculator (numbers)', lessonId: 'py-05-numbers' },
      { id: 'o6', text: 'Let Bolt listen (input)', lessonId: 'py-06-input-conversion' },
      { id: 'o7', text: 'Teach Bolt yes and no (logic)', lessonId: 'py-07-logic' },
      { id: 'o8', text: 'Teach Bolt to choose (if / else)', lessonId: 'py-08-if-else' },
      { id: 'o9', text: 'Give Bolt many paths (elif)', lessonId: 'py-09-elif' },
      { id: 'o10', text: 'Make Bolt repeat until done (while)', lessonId: 'py-10-while' },
      { id: 'o11', text: 'Make Bolt count (for and range)', lessonId: 'py-11-for-range' },
      { id: 'o12', text: 'Build reusable routines (functions)', lessonId: 'py-12-functions' },
      { id: 'o13', text: 'Write Bolt’s complete control program', lessonId: 'py-13-wake-robot' },
    ],
    reward: { xp: 150, coins: 60, items: ['robot-bolt'] },
  },
];

/**
 * Achievements are MILESTONES, never proof of skill. Conditions live in game/achievements.ts.
 */
export const achievementDefs: AchievementDef[] = [
  { id: 'first-run', title: 'It Runs!', icon: '▶️', description: 'Run your first real Python program.' },
  { id: 'first-pass', title: 'First Spell', icon: '✨', description: 'Pass your first challenge.' },
  { id: 'bug-squasher', title: 'Bug Squasher', icon: '🐛', description: 'Fix a broken program.' },
  { id: 'persistent', title: 'Not Giving Up', icon: '🔁', description: 'Pass a challenge after five or more attempts.' },
  { id: 'own-two-feet', title: 'On Your Own Two Feet', icon: '🦶', description: 'Pass a challenge without using any hints.' },
  { id: 'hat-trick', title: 'Hat Trick', icon: '🎩', description: 'Pass three challenges in a row without hints.' },
  { id: 'level-5', title: 'Rising Adventurer', icon: '⭐', description: 'Reach level 5.' },
  { id: 'shopper', title: 'Patron', icon: '🛍️', description: 'Buy something from the shop.' },
  { id: 'robot-awake', title: 'He’s Alive!', icon: '🤖', description: 'Complete “Wake the Training Robot”.' },
  { id: 'blank-page', title: 'The Blank Page', icon: '📄', description: 'Solve an Independent Trial.' },
];
