import { useEffect, useState } from 'preact/hooks';
import type { DemoStep as Demo } from '../../content/schema';
import { recordRun } from '../../game/actions';
import { getStore } from '../../game/store';
import { RichText } from './RichText';
import { emptyConsole, type ConsoleState } from './Console';
import { Workbench } from './Workbench';
import { SheetWorkbench } from './SheetWorkbench';
import { WebWorkbench } from './WebWorkbench';
import type { WebFiles } from '../../content/schema';
import { sourcesFor } from '../../content/databases';
import { runCode, useRunnerStatus } from './useRunner';
import { DataViewer } from './DataViewer';

/** A runnable example. The player must actually run it before continuing. */
export function DemoStepView({ step, onReady }: { step: Demo; onReady: () => void }) {
  const [code, setCode] = useState(step.code);
  const isWeb = step.language === 'web';
  const [files, setFiles] = useState<WebFiles>(step.files ?? { html: '', css: '', js: '' });
  const [webRan, setWebRan] = useState(false);
  const [stdin, setStdin] = useState((step.stdin ?? []).join('\n'));
  const [cons, setCons] = useState<ConsoleState>(emptyConsole);
  const [busy, setBusy] = useState(false);
  const status = useRunnerStatus(step.language === undefined || step.language === 'python' || step.language === 'sql');
  const isSheet = step.language === 'sheet';
  const [sheetCode, setSheetCode] = useState(() => JSON.stringify(step.sheet ?? { sheets: { Sheet1: {} } }));
  const [sheetRan, setSheetRan] = useState(false);

  useEffect(() => {
    if (cons.ran && (step.expectsError ? !!cons.error : true)) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cons]);
  useEffect(() => { if (webRan || sheetRan) onReady(); }, [webRan, sheetRan]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async () => {
    setBusy(true);
    const { state } = await runCode(step.language ?? 'python', code, { git: step.git, stdin, fixtures: step.fixtures, sources: sourcesFor([step.db, ...(step.fixtures?.databases ?? []).map((d) => d.split(':')[0]!)].filter(Boolean) as string[]), db: step.db });
    setCons(state);
    setBusy(false);
    getStore().apply(recordRun(getStore().save));
  };
  const needsRun = isWeb ? !webRan : isSheet ? !sheetRan : !cons.ran;
  const needsError = step.expectsError && cons.ran && !cons.error;

  return (
    <div class="two-col">
      <section class="briefing panel">
        <div class="mode-badge demo">Demonstration</div>
        <h2>{step.title}</h2>
        <RichText text={step.body} />
        <DataViewer db={step.language === 'sql' ? step.db : undefined} fixtures={step.fixtures} api={step.api} />
        {needsRun && <p class="prompt-action">▶ Run the program to continue.</p>}
        {needsError && <p class="prompt-action">This example is meant to fail. Reset the code and run it again.</p>}
        {(isWeb ? webRan : isSheet ? sheetRan : cons.ran) && !needsError && (
          <div class="notice" data-testid="notice">
            <strong>Notice:</strong> <RichText text={step.notice} />
          </div>
        )}
      </section>
      {isSheet ? (
        <SheetWorkbench spec={{ start: step.sheet ?? { sheets: { Sheet1: {} } } }} code={sheetCode} onCode={setSheetCode} onReset={() => setSheetCode(JSON.stringify(step.sheet))}><button class="btn primary" onClick={() => { setSheetRan(true); getStore().apply(recordRun(getStore().save)); }} data-testid="run">▶ Calculate</button></SheetWorkbench>
      ) : isWeb ? (
        <WebWorkbench files={files} onFiles={setFiles} tabs={['html', 'css', 'js']} api={!!step.api} onRun={() => { setWebRan(true); getStore().apply(recordRun(getStore().save)); }} onReset={() => { setFiles(step.files ?? { html: '', css: '', js: '' }); }} />
      ) : (
      <Workbench language={step.language === 'sql' ? 'sql' : step.language === 'r' ? 'r' : step.language === 'git' ? 'shell' : 'python'} code={code} onCode={setCode} stdin={stdin} onStdin={setStdin} showInput={step.language !== 'sql' && code.includes('input(')} console={cons} status={status} busy={busy} onRun={run} onReset={() => { setCode(step.code); setCons(emptyConsole); }} />
      )}
    </div>
  );
}
