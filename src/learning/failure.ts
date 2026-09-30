import type { FailureDetail } from './mastery';
import type { GradeResult } from './runner';

/**
 * Turns a grader result into a category the diagnosis engine can reason about. Pure and language-agnostic:
 * it reads only the shape of GradeResult (error text, timeout flag, which checks/constraints failed).
 */
export function failureDetailOf(result: GradeResult): FailureDetail {
  const failed = result.checks.filter((k) => !k.passed);
  const constraintsFailed = result.constraints.filter((k) => !k.passed).length;
  let errorKind: FailureDetail['errorKind'] = 'none';
  if (result.passed) errorKind = 'none';
  else if (result.timedOut) errorKind = 'timeout';
  else if (result.error) {
    if (/could not grade|could not start|sandbox/i.test(result.error)) errorKind = 'cannot-run';
    else if (/SyntaxError|IndentationError|TabError|near ".*": syntax error|incomplete input/i.test(result.error)) errorKind = 'syntax';
    else errorKind = 'runtime';
  } else if (failed.length > 0) errorKind = 'wrong-output';
  else if (constraintsFailed > 0) errorKind = 'constraint';
  return {
    errorKind,
    failedChecks: failed.map((k) => k.name).slice(0, 30),
    visibleFailed: failed.filter((k) => k.visible).length,
    hiddenFailed: failed.filter((k) => !k.visible).length,
    totalChecks: result.checks.length,
    constraintsFailed,
  };
}
