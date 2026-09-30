import type { SaveData } from '../core/save';
import { trackOfLessonId, worldOfTrack } from './worlds';
import { nextLesson } from '../game/lessons';

export interface DialogueLine {
  /** Speaker label. */
  who: 'Juno' | 'You';
  text: string;
}

/** Shown once, the first time the player reaches the Academy. Teaches the RPG mechanics honestly. */
export function introDialogue(name: string): DialogueLine[] {
  return [
    { who: 'Juno', text: `Welcome to Bytehaven Academy, ${name}! I am Mentor Juno. Around here, we learn to make computers do useful things by writing real code.` },
    { who: 'Juno', text: 'Look at the bar above. Your LEVEL and XP grow as you play. They measure how far you have adventured, not how skilled you are. Anyone can collect XP. Skill is something else, and we keep a separate, honest record of it.' },
    { who: 'Juno', text: 'FOCUS is your readiness to attempt hard work. A wrong answer on a real challenge costs Focus, and below 100 you are not ready to try again: you earn it back by training in the Training Grounds. Run your code as often as you like, that is free. Coins buy a few fashionable things.' },
    { who: 'Juno', text: 'This is not a quiz. There is no multiple choice. You will type real code (Python, SQL, JavaScript, R, Git commands, spreadsheet formulas) and it will really run. When it breaks, you will read the error and fix it, just like people who do this for a living.' },
    { who: 'Juno', text: 'I will not hand you answers. Hints exist, but every hint you open lowers your reward and is written in your record. The best reward comes from working it out yourself.' },
    { who: 'Juno', text: 'CodeQuest is not a course with one order. The map has worlds: Python, SQL, the web, Git, spreadsheets, R. Begin in any of them, leave when you like, come back later. Some places combine worlds, and they will tell you exactly which skills they need. Where would you like to start?' },
  ];
}

/** What Juno says when you visit later, based on what you have done. World-neutral: she points at the world you are in. */
export function mentorAdvice(save: SaveData): string {
  const done = Object.values(save.learning.lessons).filter((l) => l.completed).length;
  if (done === 0 && !Object.values(save.learning.lessons).some((l) => l.stepIndex > 0)) return 'Pick a world on the path chooser below and start. Every foundation is open: Python, SQL, web pages, Git, spreadsheets and R.';
  const next = nextLesson(save);
  const track = next ? worldOfTrack(trackOfLessonId(next.id)) : undefined;
  if (!next || !track) return 'You have finished every lesson that is open to you. Check the path chooser: other worlds may be waiting, and the Daily Challenge keeps old skills sharp.';
  return `Your next lesson in ${track.name.split(':')[0]} is “${next.title}”. Struggling is part of it: read the error, try something, run it again. Or leave and come back: every world keeps your place.`;
}
