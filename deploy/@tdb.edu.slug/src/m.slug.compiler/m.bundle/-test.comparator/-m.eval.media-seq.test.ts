import { describe, expect, it } from '../../-test.ts';
import {
  baselineSnapshotProvider,
  liveCompilerProvider,
  canRunLiveProviders,
  disposeLiveProviders,
  FIXTURE,
  withEvalTempDirs,
} from './u.fixture.ts';
import { compareRuns } from './u.compare.ts';
import { formatParityDiffs } from './u.report.ts';

describe('m.eval.media-seq (config-locked parity harness)', () => {
  it('proves zero-diff parity across isolated snapshot artifact collections', async () => {
    await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
      for (const docid of FIXTURE.docids) {
        const baseline = await baselineSnapshotProvider({ docid, outDir: baselineOut });
        const candidate = await baselineSnapshotProvider({ docid, outDir: candidateOut });
        const diffs = compareRuns({ baseline, candidate });
        expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
      }
    });
  });

  it('proves zero-diff parity across isolated live compiler runs', async () => {
    if (!(await canRunLiveProviders())) {
      console.info('Skipping live parity provider test (CRDT repo daemon unavailable).');
      return;
    }
    try {
      await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
        for (const docid of FIXTURE.docids) {
          const baseline = await liveCompilerProvider({ docid, outDir: baselineOut });
          const candidate = await liveCompilerProvider({ docid, outDir: candidateOut });
          const diffs = compareRuns({ baseline, candidate });
          expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
        }
      });
    } finally {
      disposeLiveProviders();
    }
  });
});
