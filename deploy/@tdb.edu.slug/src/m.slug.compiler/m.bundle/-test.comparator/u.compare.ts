import { Json } from '../common.ts';
import { type EvalRunOutput, normalizeRun } from './u.normalize.ts';

export type ParityDiff =
  | {
      readonly kind: 'missing_file' | 'unexpected_file';
      readonly file: 'assets' | 'playback' | 'tree' | 'docs';
      readonly baseline?: string;
      readonly candidate?: string;
    }
  | {
      readonly kind: 'manifest_mismatch';
      readonly file: 'assets' | 'playback' | 'tree' | 'docs';
      readonly baseline: unknown;
      readonly candidate: unknown;
    }
  | {
      readonly kind: 'result_mismatch';
      readonly baseline: unknown;
      readonly candidate: unknown;
    };

export function compareRuns(args: {
  baseline: EvalRunOutput;
  candidate: EvalRunOutput;
}): readonly ParityDiff[] {
  const baseline = normalizeRun(args.baseline);
  const candidate = normalizeRun(args.candidate);
  const diffs: ParityDiff[] = [];

  for (const key of ['assets', 'playback', 'tree', 'docs'] as const) {
    const bFile = baseline.files[key];
    const cFile = candidate.files[key];
    if (Array.isArray(bFile) || Array.isArray(cFile)) {
      const bCount = Array.isArray(bFile) ? bFile.length : 0;
      const cCount = Array.isArray(cFile) ? cFile.length : 0;
      if (bCount > 0 && cCount === 0) {
        diffs.push({ kind: 'missing_file', file: key, baseline: String(bCount) });
      } else if (bCount === 0 && cCount > 0) {
        diffs.push({ kind: 'unexpected_file', file: key, candidate: String(cCount) });
      }
    } else if (typeof bFile === 'string' && !cFile) {
      diffs.push({ kind: 'missing_file', file: key, baseline: bFile });
      continue;
    } else if (!bFile && typeof cFile === 'string') {
      diffs.push({ kind: 'unexpected_file', file: key, candidate: cFile });
      continue;
    }

    const b = baseline.artifacts[key];
    const c = candidate.artifacts[key];
    if (!deepEqual(b, c)) {
      diffs.push({ kind: 'manifest_mismatch', file: key, baseline: b, candidate: c });
    }
  }

  if (!deepEqual(baseline.result, candidate.result)) {
    diffs.push({
      kind: 'result_mismatch',
      baseline: baseline.result,
      candidate: candidate.result,
    });
  }

  return diffs;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return toCanonicalString(a) === toCanonicalString(b);
}

function toCanonicalString(value: unknown): string {
  return Json.stringify(value ?? null, 0);
}
