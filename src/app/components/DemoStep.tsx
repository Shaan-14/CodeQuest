import { useEffect, useState } from 'preact/hooks';
import type { DemoStep as Demo } from '../../content/schema';
import { recordRun } from '../../game/actions';
import { getStore } from '../../game/store';
import { RichText } from './RichText';
import { emptyConsole, type ConsoleState } from './Console';
import { Workbench } from './Workbench';
import { runPython, useRunnerStatus } from './useRunner';

/** A runnable example. The player must actually run it before continuing. */
export function DemoStepView({ step, onReady }: { step: Demo; onReady: () => void }) {
  const [code, setCode] = useState(step.code);
  const [stdin, setStdin] = useState((step.stdin ?? []).join('\n'));
  const [cons, setCons] = useState<ConsoleState>(emptyConsole);
  const [busy, setBusy] = useState(false);
  const status = useRunnerStatus();

  useEffect(() => {
    if (cons.ran && (step.expectsError ? !!cons.error : true)) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cons]);

  const run = async () => {
    setBusy(true);
    const { state } = await runPython(code, stdin);
    setCons(state);
    setBusy(false);
    getStore().apply(recordRun(getStore().save));
  };
  const needsRun = !cons.ran;
  const needsError = step.expectsError && cons.ran && !cons.error;

  return (
    <div class="two-col">
      <section class="briefing panel">
        <div class="mode-badge demo">Demonstration</div>
        <h2>{step.title}</h2>
        <RichText text={step.body} />
        {needsRun && <p class="prompt-action">▶ Run the program to continue.</p>}
        {needsError && <p class="prompt-action">This example is meant to fail. Reset the code and run it again.</p>}
        {cons.ran && !needsError && (
          <div class="notice" data-testid="notice">
            <strong>Notice:</strong> <RichText text={step.notice} />
          </div>
        )}
      </section>
      <Workbench code={code} onCode={setCode} stdin={stdin} onStdin={setStdin} showInput={code.includes('input(')} console={cons} status={status} busy={busy} onRun={run} onReset={() => { setCode(step.code); setCons(emptyConsole); }} />
    </div>
  );
}
