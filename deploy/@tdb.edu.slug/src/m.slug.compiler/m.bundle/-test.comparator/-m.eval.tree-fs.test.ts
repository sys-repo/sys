import { describe, expect, it } from '../../-test.ts';
import { compareRuns } from './u.compare.ts';
import { withEvalTempDirs } from './u.fixture.ts';
import {
  baselineTreeFsProvider,
  candidateTreeFsProvider,
  canRunTreeFsProviders,
} from './u.fixture.tree-fs.ts';
import { formatParityDiffs } from './u.report.ts';

const TREE_FS_DOCID = 'tree-fs' as const;

describe('m.eval.tree-fs (config-locked parity harness)', () => {
  it('proves zero-diff parity across isolated baseline tree-fs runs', async () => {
    const config = await canRunTreeFsProviders();
    if (!config.ok) {
      console.info(`Skipping tree-fs baseline parity test (${config.reason ?? 'config unavailable'}).`);
      return;
    }

    await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
      const baseline = await baselineTreeFsProvider({
        docid: TREE_FS_DOCID,
        outDir: baselineOut,
      });
      const candidate = await baselineTreeFsProvider({
        docid: TREE_FS_DOCID,
        outDir: candidateOut,
      });
      const diffs = compareRuns({ baseline, candidate });
      expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
    });
  });

  it('proves zero-diff parity across baseline/candidate tree-fs runs', async () => {
    const config = await canRunTreeFsProviders();
    if (!config.ok) {
      console.info(`Skipping tree-fs baseline/candidate parity test (${config.reason ?? 'config unavailable'}).`);
      return;
    }

    await withEvalTempDirs(async ({ baselineOut, candidateOut }) => {
      const baseline = await baselineTreeFsProvider({
        docid: TREE_FS_DOCID,
        outDir: baselineOut,
      });
      const candidate = await candidateTreeFsProvider({
        docid: TREE_FS_DOCID,
        outDir: candidateOut,
      });
      const diffs = compareRuns({ baseline, candidate });
      expect(diffs.length, formatParityDiffs(diffs)).to.eql(0);
    });
  });
});
