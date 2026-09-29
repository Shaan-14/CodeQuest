import type { SaveData } from '../core/save';
import { getLesson, lessons } from './index';
import { quests } from './world';

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
    { who: 'Juno', text: 'FOCUS is your mental energy. A failed submission costs some. Run your code as often as you like, that is free. When Focus is empty, come back to the Academy and rest. Coins buy tea, snacks, and a few fashionable things.' },
    { who: 'Juno', text: 'This is not a quiz. There is no multiple choice. You will type real Python, and it will really run. When it breaks, you will read the error and fix it, just like people who do this for a living.' },
    { who: 'Juno', text: 'I will not hand you answers. Hints exist, but every hint you open lowers your reward and is written in your record. The best reward comes from working it out yourself.' },
    { who: 'Juno', text: 'Now, the Training Grounds. Our training robot, Bolt-7, cannot move. His control program is unfinished. Wake him up, and along the way you will learn to program. Will you help?' },
  ];
}

/** What Juno says when you visit later, based on what you have done. */
export function mentorAdvice(save: SaveData): string {
  const quest = quests[0]!;
  const state = save.quests[quest.id];
  if (!state) return 'Ready for the challenge? Speak to me about Bolt-7.';
  if (state.status === 'complete') {
    const trial = save.learning.challenges['py-14-warehouse-audit']?.passed;
    return trial
      ? 'You woke Bolt and passed the Trial of the Blank Page. There is much more to learn, but the rest of the Academy is still being built. Check the world map for what is coming.'
      : 'Bolt is awake, thanks to you. But remember: finishing lessons is not the same as mastery. Try the Trial of the Blank Page in the Training Grounds. No hints, no scaffolding.';
  }
  const next = lessons.find((l) => !save.learning.lessons[l.id]?.completed && l.prerequisites.every((p) => save.learning.lessons[p]?.completed));
  const title = next ? getLesson(next.id)?.title : undefined;
  return title ? `Bolt is waiting. Your next lesson at the Training Grounds is “${title}”. Struggling is part of it. Read the error, try something, run it again.` : 'Head to the Training Grounds.';
}
