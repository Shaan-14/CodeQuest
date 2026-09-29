import type { ComponentChildren } from 'preact';

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;

function inline(source: string): ComponentChildren[] {
  return source.split(INLINE).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

/** Renders content strings: paragraphs (blank-line separated), `code`, **bold**, *italic*. Never uses innerHTML. */
export function RichText({ text }: { text: string }) {
  return (
    <div class="rich">
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>
          {para.split('\n').map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {inline(line)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
