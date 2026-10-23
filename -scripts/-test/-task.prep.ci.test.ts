import { describe, expect, it } from '@sys/testing/server';

import { D } from '../common.ts';
import { main as prepCi } from '../task.prep.ci.ts';
import { orderedWorkspacePaths } from '../u.graph.ts';

describe('scripts/task.prep.ci', () => {
  it('delegates to Workspace.Ci.sync with the default module paths', async () => {
    let actual: unknown;
    const sourcePaths = await orderedWorkspacePaths();

    await prepCi({}, async (args) => {
      actual = args;
      return {
        jsr: { kind: 'unchanged', target: '.github/workflows/jsr.yaml', count: 2 },
        build: { kind: 'unchanged', target: '.github/workflows/build.yaml', count: 0 },
        test: {
          linux: {
            kind: 'unchanged',
            target: '.github/workflows/test.linux.yaml',
            count: 0,
          },
          windows: {
            kind: 'skipped',
            target: '.github/workflows/test.windows.yaml',
            count: 0,
          },
        },
      } as const;
    });

    expect(actual).to.eql({
      cwd: Deno.cwd(),
      sourcePaths,
      jsrScopes: D.ci.jsrScopes,
      on: D.ci.on,
    });
  });
});
