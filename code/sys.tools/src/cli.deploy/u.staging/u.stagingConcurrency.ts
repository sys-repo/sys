/**
 * Default staging concurrency for CLI runs.
 * - prefers explicit cpu counts (when provided by caller/env plumbing)
 * - clamps to a small ceiling to avoid build+IO thrash
 */
export const stagingConcurrencyDefault = (args: {
  readonly total: number;
  readonly cpuCount?: number;
  readonly ceiling?: number; // default: 4
}): number => {
  const totalRaw: number = args.total;
  const total: number = Number.isFinite(totalRaw) && totalRaw > 0 ? Math.floor(totalRaw) : 0;

  if (total <= 1) return Math.max(1, total);

  const ceilingRaw: number = args.ceiling ?? 4;
  const ceiling: number =
    Number.isFinite(ceilingRaw) && ceilingRaw > 0 ? Math.floor(ceilingRaw) : 4;

  const cpuRaw: number = args.cpuCount ?? ceiling;
  const cpu: number = Number.isFinite(cpuRaw) && cpuRaw > 0 ? Math.floor(cpuRaw) : ceiling;

  const n: number = Math.min(total, cpu, ceiling);
  return Math.max(1, n);
};
