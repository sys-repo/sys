import { describe, expect, it } from '../../-test.ts';
import { baselineSnapshotProvider, FIXTURE, withEvalTempDirs } from './u.fixture.ts';
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

  it.skip('runs the before/after parity comparison when the candidate provider is wired to Bundle.Transform', () => {
    // Placeholder for migration phase:
    // baseline provider = current compiler media-seq path
    // candidate provider = compiler path routed through SlugBundle.Transform
  });
});
