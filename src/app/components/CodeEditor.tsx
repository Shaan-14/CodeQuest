import { useEffect, useRef } from 'preact/hooks';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentUnit } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

interface Props {
  value: string;
  onChange: (code: string) => void;
  /** Ctrl/Cmd+Enter. */
  onRun?: () => void;
  readOnly?: boolean;
  minLines?: number;
}

/**
 * CodeMirror 6 wrapper: syntax highlighting, line numbers, 4-space indentation.
 * Autocomplete is deliberately NOT enabled: the editor should not suggest solutions.
 */
export function CodeEditor({ value, onChange, onRun, readOnly = false, minLines = 8 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef({ onChange, onRun });
  cb.current = { onChange, onRun };

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          bracketMatching(),
          indentUnit.of('    '),
          python(),
          oneDark,
          EditorState.readOnly.of(readOnly),
          keymap.of([{ key: 'Mod-Enter', run: () => (cb.current.onRun?.(), true) }, indentWithTab, ...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((u) => u.docChanged && cb.current.onChange(u.state.doc.toString())),
          EditorView.theme({ '&': { minHeight: `${minLines * 1.6}em` }, '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' } }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External changes (Reset, switching challenge) replace the document.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  return <div class="editor" ref={host} data-testid="editor" />;
}
