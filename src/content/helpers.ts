/** Join paragraphs with blank lines (the format Lesson/Challenge text uses). */
export const text = (...paragraphs: string[]): string => paragraphs.join('\n\n');

/** The learning objective a challenge tests (variants share one). Defaults to the challenge's own id. */
export const objectiveOf = (c: { id: string; objectiveId?: string }): string => c.objectiveId ?? c.id;
