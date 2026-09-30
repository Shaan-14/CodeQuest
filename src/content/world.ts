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
    id: 'data-center', name: 'Database District', icon: '🗄️', theme: 'data', pos: { x: 62, y: 38 },
    tagline: 'Tables, queries, and vast archives',
    description: 'SQL City: rows of tall archives where every table is related to another. Architect Vex teaches SQL and database design here.',
    lock: { type: 'lesson', lessonId: 'py-21-cleaning', reason: 'The gates open once you can clean messy data. Finish “Messy Data” in the Training Grounds.' },
  },
  {
    id: 'pipeline-works', name: 'Data Pipeline Works', icon: '🏭', theme: 'pipeline', pos: { x: 84, y: 30 },
    tagline: 'Move data without breaking it',
    description: 'A factory where raw data arrives on conveyor belts and leaves as clean, trustworthy tables. Engineer Ori keeps it running.',
    lock: { type: 'lesson', lessonId: 'sql-13-integrity-performance', reason: 'Finish “Safe and Fast” in the Database District: pipelines load into databases you can already design.' },
  },
  {
    id: 'web-workshop', name: 'Web Workshop', icon: '🌐', theme: 'web', pos: { x: 34, y: 38 },
    tagline: 'Build things people can click',
    description: 'A workshop of half-built websites: HTML, CSS, JavaScript, and APIs.',
    lock: { type: 'future', phase: 3, reason: 'Under construction. Opens in a future update (Phase 3: the web).' },
  },
  {
    id: 'observatory', name: 'Analytics Observatory', icon: '🔭', theme: 'observatory', pos: { x: 14, y: 40 },
    tagline: 'Find the story inside the numbers',
    description: 'Data analysis, statistics, R, and spreadsheets.',
    lock: { type: 'future', phase: 4, reason: 'The lens is still being ground. Opens in a future update (Phase 4: analysis and statistics).' },
  },
  {
    id: 'summit', name: 'The Summit', icon: '🏔️', theme: 'summit', pos: { x: 48, y: 14 },
    tagline: 'Original projects, no map provided',
    description: 'The final ascent: open-ended projects across every technology you have learned.',
    lock: { type: 'future', phase: 5, reason: 'The path is not yet cut. Opens after the core curriculum.' },
  },
];

/** Nothing here sells answers, hints, or XP. Items only restore Focus or decorate the avatar. */
export const items: Item[] = [
  { id: 'study-snack', name: 'Study Snack', icon: '🍪', kind: 'consumable', price: 10, restoreFocus: 20, description: 'Restores 20 Focus.' },
  { id: 'focus-tea', name: 'Focus Tea', icon: '🍵', kind: 'consumable', price: 25, restoreFocus: 50, description: 'Restores 50 Focus.' },
  { id: 'explorer-cape', name: 'Explorer’s Cape', icon: '🧣', kind: 'cosmetic', price: 80, description: 'A red cape. Purely stylish; worn automatically.' },
  { id: 'lucky-cap', name: 'Lucky Cap', icon: '🧢', kind: 'cosmetic', price: 60, description: 'A well-worn ball cap. Purely stylish; worn automatically.' },
  { id: 'daily-medal', name: 'Daily Medal', icon: '🎖️', kind: 'quest', price: null, description: 'Earned for solving 10 Daily Challenges. Cannot be bought.' },
  { id: 'sharp-monocle', name: 'Sharp Monocle', icon: '🧐', kind: 'quest', price: null, description: 'Earned for solving 25 Daily Challenges. Cannot be bought.' },
  { id: 'golden-hourglass', name: 'Golden Hourglass', icon: '⏳', kind: 'quest', price: null, description: 'Earned for solving 50 Daily Challenges. Cannot be bought.' },
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
  {
    id: 'ledger-vault',
    title: 'The Ledger Vault',
    giver: 'Mentor Juno',
    requires: 'wake-the-robot',
    summary: 'The Academy’s records are a mess of lists, files and half-working scripts. Learn the intermediate Python that real data work needs, then prove yourself in the vault trial.',
    objectives: [
      { id: 'l1', text: 'Handle many values (lists)', lessonId: 'py-15-lists' },
      { id: 'l2', text: 'Look things up (dicts and sets)', lessonId: 'py-16-dicts' },
      { id: 'l3', text: 'Model records', lessonId: 'py-17-records' },
      { id: 'l4', text: 'Design good functions', lessonId: 'py-18-function-design' },
      { id: 'l5', text: 'Debug like a detective', lessonId: 'py-19-debugging' },
      { id: 'l6', text: 'Read and write files, CSV and JSON', lessonId: 'py-20-files' },
      { id: 'l7', text: 'Clean messy data', lessonId: 'py-21-cleaning' },
      { id: 'l8', text: 'Use libraries and documentation', lessonId: 'py-22-libraries' },
      { id: 'l9', text: 'Prove it works (tests)', lessonId: 'py-23-testing' },
      { id: 'l10', text: 'Model the world with objects', lessonId: 'py-24-oop' },
      { id: 'l11', text: 'Build multi-step projects', lessonId: 'py-25-projects' },
      { id: 'l12', text: 'Face the vault trial', lessonId: 'py-26-independent-python' },
    ],
    reward: { xp: 250, coins: 90 },
  },
  {
    id: 'database-district',
    title: 'The Database District',
    giver: 'Architect Vex',
    requires: 'ledger-vault',
    summary: 'The district’s archives have fallen out of order. Learn SQL and database design to find what is lost, fix what is wrong, and build tables that protect themselves.',
    objectives: [
      { id: 's1', text: 'Ask the database questions', lessonId: 'sql-01-select' },
      { id: 's2', text: 'Rank and limit results', lessonId: 'sql-02-sort-limit' },
      { id: 's3', text: 'Understand NULL', lessonId: 'sql-03-null' },
      { id: 's4', text: 'Summarise many rows', lessonId: 'sql-04-aggregates' },
      { id: 's5', text: 'Group rows', lessonId: 'sql-05-group' },
      { id: 's6', text: 'Join related tables', lessonId: 'sql-06-joins' },
      { id: 's7', text: 'Find what does not match', lessonId: 'sql-07-left-join' },
      { id: 's8', text: 'Decide inside a query (CASE)', lessonId: 'sql-08-case' },
      { id: 's9', text: 'Change data safely', lessonId: 'sql-09-modify' },
      { id: 's10', text: 'Subqueries and CTEs', lessonId: 'sql-10-subqueries' },
      { id: 's11', text: 'Window functions', lessonId: 'sql-11-window' },
      { id: 's12', text: 'Design tables', lessonId: 'sql-12-design' },
      { id: 's13', text: 'Integrity, indexes and transactions', lessonId: 'sql-13-integrity-performance' },
      { id: 's14', text: 'Face the Records Hall trial', lessonId: 'sql-14-independent' },
    ],
    reward: { xp: 350, coins: 120 },
  },
  {
    id: 'pipeline-works',
    title: 'Keep the Pipeline Running',
    giver: 'Engineer Ori',
    requires: 'database-district',
    summary: 'The overnight data feed keeps breaking the plant’s database. Build loads that are safe to repeat, survive bad rows, and combine Python with SQL.',
    objectives: [
      { id: 'p1', text: 'Build reliable pipelines', lessonId: 'de-01-pipelines' },
      { id: 'p2', text: 'Combine Python and SQL', lessonId: 'de-02-python-sql' },
      { id: 'p3', text: 'Face the overnight-feed trial', lessonId: 'de-03-independent' },
    ],
    reward: { xp: 300, coins: 100 },
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
  { id: 'first-daily', title: 'First Daily', icon: '🌅', description: 'Solve a Daily Challenge.' },
  { id: 'daily-5', title: 'Five Dailies', icon: '5️⃣', description: 'Solve 5 Daily Challenges.' },
  { id: 'daily-10', title: 'Ten Dailies', icon: '🔟', description: 'Solve 10 Daily Challenges.' },
  { id: 'daily-25', title: 'Twenty-Five Dailies', icon: '🎯', description: 'Solve 25 Daily Challenges.' },
  { id: 'daily-50', title: 'Fifty Dailies', icon: '🏆', description: 'Solve 50 Daily Challenges.' },
  { id: 'daily-100', title: 'One Hundred Dailies', icon: '💯', description: 'Solve 100 Daily Challenges.' },
  { id: 'perfect-week', title: 'Perfect Week', icon: '📅', description: 'Solve 7 Daily Challenges within any seven-day window. Missing days costs nothing.' },
  { id: 'cross-skill', title: 'Cross-Skill Master', icon: '🧭', description: 'Solve Daily Challenges in four different skill categories.' },
  { id: 'old-skills-sharp', title: 'Old Skills Still Sharp', icon: '🗡️', description: 'Solve 5 hard review Daily Challenges on skills you learned earlier.' },
  { id: 'blank-page', title: 'The Blank Page', icon: '📄', description: 'Solve an Independent Trial.' },
  { id: 'first-query', title: 'First Query', icon: '🗄️', description: 'Pass your first SQL challenge.' },
  { id: 'retry-wisdom', title: 'A Different Angle', icon: '🔀', description: 'Pass a different problem on an idea you failed before.' },
  { id: 'researcher', title: 'Read the Manual', icon: '📖', description: 'Look something up in the Field Manual while solving a challenge.' },
  { id: 'vault-open', title: 'Vault Opened', icon: '🔐', description: 'Complete “The Ledger Vault”.' },
  { id: 'district-cleared', title: 'District Cleared', icon: '🏙️', description: 'Complete “The Database District”.' },
  { id: 'pipeline-running', title: 'Pipeline Running', icon: '🏭', description: 'Complete “Keep the Pipeline Running”.' },
];
