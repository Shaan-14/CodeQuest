/** Persistence of the SQL Sandbox databases. Separate from the game save: resetting one never touches the other. */
export const SANDBOX_KEY = 'codequest.sandbox.v1';

/** The sandbox database state lives under its own key: resetting it never touches the game save. */
export function loadSandboxState(store: Pick<Storage, 'getItem'> = localStorage): Record<string, string> {
  try {
    const v = JSON.parse(store.getItem(SANDBOX_KEY) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export function saveSandboxState(state: Record<string, string>, store: Pick<Storage, 'setItem'> = localStorage): void {
  try { store.setItem(SANDBOX_KEY, JSON.stringify(state)); } catch { /* storage full or blocked: the sandbox still works this session */ }
}

