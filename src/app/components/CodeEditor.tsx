import { useEffect, useRef } from 'preact/hooks';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentUnit } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

interface Props {
  value: string;
  onChange: (code: string) => void;
  /** Ctrl/Cmd+Enter. */
  onRun?: () => void;
  readOnly?: boolean;
  minLines?: number;
  language?: EditorLanguage;
}

export type EditorLanguage = 'python' | 'sql' | 'html' | 'css' | 'js';

/** Language support is loaded on demand, so each language's parser is its own chunk and only downloaded when used. */
const LOADERS: Record<EditorLanguage, () => Promise<Extension>> = {
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
};

/**
 * CodeMirror 6 wrapper: syntax highlighting, line numbers, 4-space indentation.
 * Autocomplete is deliberately NOT enabled: the editor should not suggest solutions.
 */
export function CodeEditor({ value, onChange, onRun, readOnly = false, minLines = 8, language = 'python' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef({ onChange, onRun });
  cb.current = { onChange, onRun };

  useEffect(() => {
    const lang = new Compartment();
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
          lang.of([]),
          oneDark,
          EditorState.readOnly.of(readOnly),
          keymap.of([{ key: 'Mod-Enter', run: () => (cb.current.onRun?.(), true) }, indentWithTab, ...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((u) => u.docChanged && cb.current.onChange(u.state.doc.toString())),
          EditorView.theme({ '&': { minHeight: `${minLines * 1.6}em` }, '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' } }),
        ],
      }),
    });
    view.current = v;
    let alive = true;
    LOADERS[language]().then((ext) => alive && v.dispatch({ effects: lang.reconfigure(ext) })).catch(() => undefined);
    return () => {
      alive = false;
      v.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External changes (Reset, switching challenge) replace the document.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  return <div class="editor" ref={host} data-testid="editor" />;
}
