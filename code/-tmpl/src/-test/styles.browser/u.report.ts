import { Is, Obj } from './common.ts';

export type Comparison = {
  phase: string;
  id: string;
  key: string;
  actual: Record<string, string>;
  baseline: Record<string, string>;
  differences: string[];
};
export type RuleFailure = { phase: string; descendantRules: number };
type ReportInput = {
  browserVersion: string;
  userAgent: string;
  comparisons: readonly Comparison[];
  ruleFailures: readonly RuleFailure[];
  error?: string;
};
export type Report = ReturnType<typeof createReport>;

/** One value-owned report for both the visible JSON and the browser completion receipt. */
export function createReport(input: ReportInput) {
  // A baseline is reused across phases, and a failure also appears in comparisons. Capture each
  // value separately: cloning the entire graph would preserve aliases that Json.stringify elides.
  const comparisons = input.comparisons.map((item) => ({
    ...item,
    actual: Obj.clone(item.actual),
    baseline: Obj.clone(item.baseline),
    differences: Obj.clone(item.differences),
  }));
  const failures = [
    ...comparisons.filter((item) => item.differences.length > 0).map((item) => Obj.clone(item)),
    ...input.ruleFailures.map((item) => Obj.clone(item)),
  ];
  return {
    result: !Is.nil(input.error)
      ? 'ERROR'
      : failures.length === 0
      ? 'PASS — computed styles; visual review still required'
      : 'FAIL',
    ...(!Is.nil(input.error) ? { error: input.error } : {}),
    browserVersion: input.browserVersion.trim() || null,
    userAgent: input.userAgent,
    recordedAt: new Date().toISOString(),
    strictMode: true,
    baseline: '519b15ea8 isolated paint recipe; one palette per fresh iframe document',
    source:
      'generated @fixture/ui:XMLPanel; current workspace authorities, not published compatibility',
    failures,
    comparisons,
  };
}
