import type { ParityDiff } from './u.compare.ts';

export function formatParityDiffs(diffs: readonly ParityDiff[]): string {
  if (diffs.length === 0) return 'no diffs';
  const lines = diffs.map((diff, i) => {
    const n = `${i + 1}.`;
    if (diff.kind === 'missing_file') return `${n} missing_file ${diff.file} (baseline=${diff.baseline})`;
    if (diff.kind === 'unexpected_file')
      return `${n} unexpected_file ${diff.file} (candidate=${diff.candidate})`;
    if (diff.kind === 'manifest_mismatch') return `${n} manifest_mismatch ${diff.file}`;
    return `${n} result_mismatch`;
  });
  return lines.join('\n');
}

