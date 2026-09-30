import { useEffect, useState } from 'preact/hooks';
import type { DemoStep as Demo } from '../../content/schema';
import { recordRun } from '../../game/actions';
import { getStore } from '../../game/store';
import { RichText } from './RichText';
import { emptyConsole, type ConsoleState } from './Console';
import { Workbench } from './Workbench';
import { WebWorkbench } from './WebWorkbench';
import type { WebFiles } from '../../content/schema';
import { sourcesFor } from '../../content/databases';
import { runCode, useRunnerStatus } from './useRunner';
import { SchemaBrowser } from './SchemaBrowser';

/** A runnable example. The player must actually run it before continuing. */
export function DemoStepView({ step, onReady }: { step: Demo; onReady: () => void }) {
  const [code, setCode] = useState(step.code);
  const isWeb = step.language === 'web';
  const [files, setFiles] = useState<WebFiles>(step.files ?? { html: '', css: '', js: '' });
  const [webRan, setWebRan] = useState(false);
  const [stdin, setStdin] = useState((step.stdin ?? []).join('\n'));
  const [cons, setCons] = useState<ConsoleState>(emptyConsole);
  const [busy, setBusy] = useState(false);
  const status = useRunnerStatus(step.language !== 'web');

  useEffect(() => {
    if (cons.ran && (step.expectsError ? !!cons.error : true)) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cons]);
  useEffect(() => { if (webRan) onReady(); }, [webRan]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async () => {
    setBusy(true);
    const { state } = await runCode(step.language ?? 'python', code, { stdin, fixtures: step.fixtures, sources: sourcesFor([step.db, ...(step.fixtures?.databases ?? []).map((d) => d.split(':')[0]!)].filter(Boolean) as string[]), db: step.db });
    setCons(state);
    setBusy(false);
    getStore().apply(recordRun(getStore().save));
  };
  const needsRun = isWeb ? !webRan : !cons.ran;
  const needsError = step.expectsError && cons.ran && !cons.error;

  return (
    <div class="two-col">
      <section class="briefing panel">
        <div class="mode-badge demo">Demonstration</div>
        <h2>{step.title}</h2>
        <RichText text={step.body} />
        {step.language === 'sql' && step.db && <SchemaBrowser dbId={step.db} />}
        {needsRun && <p class="prompt-action">▶ Run the program to continue.</p>}
        {needsError && <p class="prompt-action">This example is meant to fail. Reset the code and run it again.</p>}
        {(isWeb ? webRan : cons.ran) && !needsError && (
          <div class="notice" data-testid="notice">
            <strong>Notice:</strong> <RichText text={step.notice} />
          </div>
        )}
      </section>
      {isWeb ? (
        <WebWorkbench files={files} onFiles={setFiles} tabs={['html', 'css', 'js']} api={!!step.api} onRun={() => { setWebRan(true); getStore().apply(recordRun(getStore().save)); }} onReset={() => { setFiles(step.files ?? { html: '', css: '', js: '' }); }} />
      ) : (
      <Workbench language={step.language === 'sql' ? 'sql' : 'python'} code={code} onCode={setCode} stdin={stdin} onStdin={setStdin} showInput={step.language !== 'sql' && code.includes('input(')} console={cons} status={status} busy={busy} onRun={run} onReset={() => { setCode(step.code); setCons(emptyConsole); }} />
      )}
    </div>
  );
}
