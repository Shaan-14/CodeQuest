/** Line-based three-way merge, the way Git merges a file: changes on only one side apply, identical changes apply once, overlapping different changes conflict. */

interface Edit { start: number; end: number; lines: string[] } // replace base[start:end] by lines

/** LCS-based edit script from `a` to `b`, as a list of replaced base ranges. */
function diffEdits(a: string[], b: string[]): Edit[] {
  const n = a.length; const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const edits: Edit[] = [];
  let i = 0; let j = 0;
  let cur: Edit | null = null;
  const flush = () => { if (cur) { edits.push(cur); cur = null; } };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { flush(); i++; j++; }
    else if (j < m && (i === n || dp[i]![j + 1]! >= dp[i + 1]![j]!)) { cur ??= { start: i, end: i, lines: [] }; cur.lines.push(b[j]!); j++; }
    else { cur ??= { start: i, end: i, lines: [] }; cur.end = i + 1; i++; }
  }
  flush();
  return edits;
}

export const splitLines = (s: string): string[] => (s === '' ? [] : s.replace(/\n$/, '').split('\n'));
export const joinLines = (l: string[]): string => (l.length ? l.join('\n') + '\n' : '');

export interface MergeResult { text: string; conflict: boolean }

export function merge3(base: string, ours: string, theirs: string, oursLabel = 'HEAD', theirsLabel = 'theirs'): MergeResult {
  if (ours === theirs) return { text: ours, conflict: false };
  if (base === ours) return { text: theirs, conflict: false };
  if (base === theirs) return { text: ours, conflict: false };
  const B = splitLines(base); const O = splitLines(ours); const T = splitLines(theirs);
  const eo = diffEdits(B, O); const et = diffEdits(B, T);
  const out: string[] = [];
  let conflict = false;
  let pos = 0; let io = 0; let it = 0;
  // Like Git, changes that overlap OR touch (adjacent lines) are a conflict unless both sides made the same change.
  const overlap = (x: Edit, y: Edit) => x.start <= y.end && y.start <= x.end;
  while (io < eo.length || it < et.length) {
    const a = eo[io]; const b = et[it];
    if (a && b && overlap(a, b)) {
      // grow both sides until the conflicting region is closed
      let start = Math.min(a.start, b.start); let end = Math.max(a.end, b.end);
      let ia = io + 1; let ib = it + 1;
      for (let changed = true; changed;) {
        changed = false;
        while (eo[ia] && eo[ia]!.start < end) { end = Math.max(end, eo[ia]!.end); ia++; changed = true; }
        while (et[ib] && et[ib]!.start < end) { end = Math.max(end, et[ib]!.end); ib++; changed = true; }
      }
      const side = (edits: Edit[], from: number, to: number): string[] => {
        const lines: string[] = []; let p = start;
        for (const e of edits.slice(from, to)) { lines.push(...B.slice(p, e.start), ...e.lines); p = e.end; }
        lines.push(...B.slice(p, end));
        return lines;
      };
      out.push(...B.slice(pos, start));
      const mine = side(eo, io, ia); const their = side(et, it, ib);
      if (mine.join('\n') === their.join('\n')) out.push(...mine);
      else { conflict = true; out.push(`<<<<<<< ${oursLabel}`, ...mine, '=======', ...their, `>>>>>>> ${theirsLabel}`); }
      pos = end; io = ia; it = ib;
    } else if (a && (!b || a.start <= b.start)) { out.push(...B.slice(pos, a.start), ...a.lines); pos = a.end; io++; }
    else if (b) { out.push(...B.slice(pos, b.start), ...b.lines); pos = b.end; it++; }
  }
  out.push(...B.slice(pos));
  return { text: joinLines(out), conflict };
}

/** A unified-style diff (one hunk per changed region, 1 line of context is enough for teaching). */
export function unifiedDiff(path: string, before: string | undefined, after: string | undefined): string {
  const A = splitLines(before ?? ''); const B = splitLines(after ?? '');
  if (before === after) return '';
  const edits = diffEdits(A, B);
  const out = [`diff --git a/${path} b/${path}`, before === undefined ? 'new file' : after === undefined ? 'deleted file' : 'index 0000000..0000000', `--- ${before === undefined ? '/dev/null' : 'a/' + path}`, `+++ ${after === undefined ? '/dev/null' : 'b/' + path}`];
  let offset = 0;
  for (const e of edits) {
    const ctxStart = Math.max(0, e.start - 1);
    const ctxEnd = Math.min(A.length, e.end + 1);
    out.push(`@@ -${ctxStart + 1},${ctxEnd - ctxStart} +${ctxStart + 1 + offset},${ctxEnd - ctxStart - (e.end - e.start) + e.lines.length} @@`);
    for (let i = ctxStart; i < e.start; i++) out.push(' ' + A[i]);
    for (let i = e.start; i < e.end; i++) out.push('-' + A[i]);
    for (const l of e.lines) out.push('+' + l);
    for (let i = e.end; i < ctxEnd; i++) out.push(' ' + A[i]);
    offset += e.lines.length - (e.end - e.start);
  }
  return out.join('\n');
}
