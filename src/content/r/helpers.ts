import type { Check, OutputCheck } from '../schema';

/** An R program's printed output, optionally against a different input file (hidden data). */
export const rOut = (name: string, expect: string, files?: Record<string, string>, visible = true): OutputCheck => ({ kind: 'output', name, expect, files, visible });

/** R code shipped with every function check: numbers and vectors compare with a tolerance, data frames compare by content. */
const SAME = `.cq_norm <- function(x) {
  if (is.data.frame(x)) {
    x <- as.data.frame(lapply(x, function(col) if (is.factor(col)) as.character(col) else col), stringsAsFactors = FALSE)
    rownames(x) <- NULL
  }
  x
}
.cq_same <- function(a, b) isTRUE(all.equal(.cq_norm(a), .cq_norm(b), check.attributes = is.data.frame(a) && is.data.frame(b)))
.cq_show <- function(x) paste(capture.output(print(.cq_norm(x))), collapse = " | ")
`;

/**
 * Function checks against an embedded reference (so expected values are computed, never typed).
 * The first `visible` cases show expected and actual; the rest only say a hidden case failed.
 * `args` are R argument lists as source text; `setup` (optional R code) runs first and may define data used by the cases.
 */
export function rCalls(fn: string, reference: string, cases: string[], visible = 2, setup = '', note = 'Your function gave a different result from the specification for one of the hidden inputs.'): Check[] {
  return cases.map((args, i) => {
    const show = i < visible;
    const label = args.replace(/\s+/g, ' ');
    return {
      kind: 'script' as const,
      name: show ? `${fn}(${label.length > 60 ? `${label.slice(0, 57)}...` : label})` : `Hidden case ${i + 1}`,
      visible: show,
      code: `${SAME}${setup}\n${reference}\n.cq_exp <- .cq_ref(${args})\n.cq_got <- ${fn}(${args})\nif (!.cq_same(.cq_got, .cq_exp)) stop(${show ? 'paste0("Expected ", .cq_show(.cq_exp), " but got ", .cq_show(.cq_got))' : JSON.stringify(note)})`,
    };
  });
}
