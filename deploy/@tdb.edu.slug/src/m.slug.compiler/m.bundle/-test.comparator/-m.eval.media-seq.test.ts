import { describe, expect, it } from '../../-test.ts';
import {
  baselineSnapshotProvider,
  baselineLiveProvider,
  candidateLiveProvider,
  canRunLiveProviders,
  disposeLiveProviders,
  FIXTURE,
  withEvalTempDirs,
} from './u.fixture.ts';
import { compareRuns } from './u.compare.ts';
import { formatParityDiffs } from './u.report.ts';

describe('m.eval.media-seq (before/after parity harness)', () => {
  it('proves the harness with a before/before zero-diff comparison (config-locked snapshot)', async () => {
    await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
      for (const docid of FIXTURE.docids) {
        const baseline = await baselineSnapshotProvider({ docid, outDir: baselineOut });
        const candidate = await baselineSnapshotProvider({ docid, outDir: candidateOut });
        const diffs = compareRuns({ baseline, candidate });
        expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
      }
    });
  });

  it('proves the harness with a before/before zero-diff comparison (live compiler path)', async () => {
    if (!(await canRunLiveProviders())) {
      console.info('Skipping live parity provider test (CRDT repo daemon unavailable).');
      return;
    }
    try {
      await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
        for (const docid of FIXTURE.docids) {
          const baseline = await baselineLiveProvider({ docid, outDir: baselineOut });
          const candidate = await baselineLiveProvider({ docid, outDir: candidateOut });
          const diffs = compareRuns({ baseline, candidate });
          expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
        }
      });
    } finally {
      disposeLiveProviders();
    }
  });

  it('runs the before/after parity comparison when the candidate provider is wired to Bundle.Transform', async () => {
    if (!(await canRunLiveProviders())) {
      console.info('Skipping before/after parity comparison (CRDT repo daemon unavailable).');
      return;
    }
    try {
      await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
        for (const docid of FIXTURE.docids) {
          const baseline = await baselineLiveProvider({ docid, outDir: baselineOut });
          const candidate = await candidateLiveProvider({ docid, outDir: candidateOut });
          const diffs = compareRuns({ baseline, candidate });
          expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
        }
      });
    } finally {
      disposeLiveProviders();
    }
  });
});
