import { describe, expect, it } from '@sys/testing/server';
import { main, toJsrCiPaths } from '../task.prep.ci.ts';

describe('scripts/task.prep.ci', () => {
  it('filters an explicit ordered source subset to jsr-publishable modules', () => {
    const paths = [
      'code/sys/types',
      'code/sys/std',
      'code/sys.driver/driver-deno',
      'code/sys.model/model-slug',
      'code/sys/workspace',
      'code/-tmpl',
      'deploy/@tdb.edu.slug',
      'deploy/@tdb.slc.std',
      'deploy/@tdb.slc.data',
      'deploy/sample.proxy',
    ];

    expect(toJsrCiPaths(paths)).to.eql([
      'code/sys/types',
      'code/sys/std',
      'code/sys.driver/driver-deno',
      'code/sys.model/model-slug',
      'code/sys/workspace',
      'code/-tmpl',
      'deploy/@tdb.edu.slug',
      'deploy/@tdb.slc.std',
      'deploy/@tdb.slc.data',
    ]);
  });

  it('refreshes the workspace graph before syncing CI workflows', async () => {
    const calls: string[] = [];

    await main(
      { sourcePaths: ['code/sys/workspace', 'deploy/@tdb.slc.data'] },
      {
        ensureGraph: async (_cwd) => {
          calls.push('ensureGraph');
        },
        syncJsr: async (_args) => {
          calls.push('syncJsr');
          return { kind: 'unchanged', target: '.github/workflows/jsr.yaml', count: 2 } as const;
        },
        syncBuild: async (_args) => {
          calls.push('syncBuild');
          return { kind: 'unchanged', target: '.github/workflows/build.yaml', count: 0 } as const;
        },
        syncTest: async (_args) => {
          calls.push('syncTest');
          return { kind: 'unchanged', target: '.github/workflows/test.yaml', count: 0 } as const;
        },
      },
    );

    expect(calls).to.eql(['ensureGraph', 'syncJsr', 'syncBuild', 'syncTest']);
  });
});
