/** Join paragraphs with blank lines (the format Lesson/Challenge text uses). */
export const text = (...paragraphs: string[]): string => paragraphs.join('\n\n');
