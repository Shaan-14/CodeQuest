/**
 * Web Worker hosting Pyodide (CPython compiled to WebAssembly). Player code only ever runs here,
 * never on the main thread: it has no DOM, no localStorage, and no access to the host OS.
 * See ARCHITECTURE.md "Security model" for what this does and does not guarantee.
 */
import { createPythonEngine, type PythonEngine } from './pythonEngine';

// The DOM lib types `self` as Window; this file is a worker, so use a narrow local view of it.
const ctx = self as unknown as {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
} & Record<string, unknown>;

// Keep our own channel to the main thread, then remove the global so player code cannot
// trivially call js.postMessage(...) to forge results.
const post = ctx.postMessage.bind(ctx);
let engine: PythonEngine | null = null;

/** Best-effort removal of network/storage APIs so player code cannot phone home or persist data. */
function lockDown() {
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches', 'importScripts', 'postMessage']) {
    try {
      Object.defineProperty(ctx, name, { value: undefined, configurable: false, writable: false });
    } catch {
      /* some globals are non-configurable in some browsers */
    }
  }
}

async function init(indexURL: string) {
  const { loadPyodide } = await import(/* @vite-ignore */ indexURL + 'pyodide.mjs');
  const pyodide = await loadPyodide({ indexURL });
  engine = createPythonEngine(pyodide);
  lockDown();
}

ctx.onmessage = async (event: MessageEvent) => {
  const msg = event.data;
  try {
    if (msg.type === 'init') {
      await init(msg.indexURL);
      post({ type: 'ready' });
    } else if (msg.type === 'run' && engine) {
      post({ id: msg.id, result: engine.run(msg.payload) });
    } else if (msg.type === 'grade' && engine) {
      post({ id: msg.id, result: engine.grade(msg.payload) });
    }
  } catch (e) {
    post({ id: msg.id, type: 'error', message: String(e) });
  }
};
