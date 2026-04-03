import { describe, expect, it } from '@sys/testing/server';
import { Workspace } from '@sys/workspace';

import { Paths } from '../-PATHS.ts';
import { D } from '../common.ts';

describe('scripts/task.prep.ci', () => {
  it('delegates to Workspace.Ci.sync with the default module paths', async () => {
    let actual: unknown;
    const sync = Workspace.Ci.sync;

    Workspace.Ci.sync = async (args) => {
      actual = args;
      return {
        jsr: { kind: 'unchanged', target: '.github/workflows/jsr.yaml', count: 2 },
        build: { kind: 'unchanged', target: '.github/workflows/build.yaml', count: 0 },
        test: { kind: 'unchanged', target: '.github/workflows/test.yaml', count: 0 },
      } as const;
    };

    try {
      await import(`../task.prep.ci.ts?test=${Date.now()}`);
    } finally {
      Workspace.Ci.sync = sync;
    }

    expect(actual).to.eql({
      cwd: Deno.cwd(),
      sourcePaths: Paths.modules,
      jsrScopes: D.ci.jsrScopes,
      on: D.ci.on,
    });
  });
});
