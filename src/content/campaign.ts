/**
 * The campaign is finite. Story beats are data: acts in order, each naming the boss that closes it. The ending is the
 * Summit Trial (content/bosses.ts). Lesson count is never a ceiling; lessons grow, the ending stays the same.
 * Future worlds (Baseball, Racing, an original academy, Engineering) attach as new acts/areas without touching the
 * learning engine, which only knows skills, challenges and evidence.
 */
export interface Act {
  id: string;
  title: string;
  /** What is happening in the story, in a paragraph. */
  story: string;
  /** The boss that closes this act (empty for the opening). */
  bossId?: string;
}

export const acts: Act[] = [
  { id: 'act-1', title: 'Act I: The Academy', story: 'Bytehaven’s systems are failing one by one. Mentor Juno trains new engineers at the Academy, starting with a broken robot and a blank editor.', bossId: 'mini-python-functions' },
  { id: 'act-2', title: 'Act II: The Grounds', story: 'The failures trace back to bad scripts written under pressure. The Programming Hall is where those scripts get rebuilt, properly, by you.', bossId: 'mastery-python' },
  { id: 'act-3', title: 'Act III: The Archives', story: 'The data behind the city lives in the Database District. Something has been quietly corrupting it, and only someone who can question a database can find out what.', bossId: 'mastery-sql' },
  { id: 'act-4', title: 'Act IV: The Works', story: 'Data reaches the archives through the Data Pipeline Works, and the feeds have been arriving dirty and duplicated. The pipelines must be made trustworthy.', bossId: 'mastery-data-eng' },
  { id: 'act-5', title: 'Act V: The Web', story: 'People see Bytehaven through the Web District, and its pages are silently wrong. Rebuild them so that they respond, remember and never lie.', bossId: 'mastery-web' },
  { id: 'act-6', title: 'Act VI: The Summit', story: 'All the failures point to one night: the Great Outage. Climb to the Summit, gather what you know, and write the report that shows what happened.', bossId: 'summit' },
];

export const ENDING = {
  title: 'You reached the Summit',
  body: 'You started with a broken robot and a blank editor. You finish able to face a problem nobody prepared you for, find out what you do not know, learn it, and prove your work. Old lessons never went away; they were tools you kept sharpening. CodeQuest is complete, and your record shows the evidence behind every claim above.',
};
