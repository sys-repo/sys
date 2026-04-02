import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { main, toJsrCiPaths } from '../task.prep.ci.ts';

describe('scripts/task.prep.ci', () => {
  it('filters an explicit ordered source subset to jsr-publishable modules', async () => {
    const fs = await Testing.dir('scripts.task.prep.ci.jsr-paths');
    const create = async (path: string, denojson: Record<string, unknown>) => {
      await Fs.writeJson(fs.join(path, 'deno.json'), denojson);
      return path;
    };

    const paths = await Promise.all([
      create('code/sys/types', { name: '@sys/types', version: '0.0.1' }),
      create('code/sys/std', { name: '@sys/std', version: '0.0.1' }),
      create('code/sys.driver/driver-deno', { name: '@sys/driver-deno', version: '0.0.1' }),
      create('code/sys.model/model-slug', { name: '@sys/model-slug', version: '0.0.1' }),
      create('code/sys/workspace', { name: '@sys/workspace', version: '0.0.1' }),
      create('code/-tmpl', { name: '@sys/tmpl', version: '0.0.1' }),
      create('deploy/@tdb.edu.slug', { name: '@tdb/edu-slug', version: '0.0.1' }),
      create('deploy/@tdb.slc.std', { name: '@tdb/slc-std', version: '0.0.1' }),
      create('deploy/@tdb.slc.data', { name: '@tdb/slc-data', version: '0.0.1' }),
      create('deploy/@tdb.slc.fs', { name: '@tdb/slc-fs', version: '0.0.1' }),
      create('deploy/@tdb.slc', { name: '@tdb/slc', version: '0.0.0' }),
      create('deploy/sample.proxy', { name: '@sample/proxy', version: '0.0.1' }),
    ]);

    expect(await toJsrCiPaths(paths, fs.dir)).to.eql([
      'code/sys/types',
      'code/sys/std',
      'code/sys.driver/driver-deno',
      'code/sys.model/model-slug',
      'code/sys/workspace',
      'code/-tmpl',
      'deploy/@tdb.edu.slug',
      'deploy/@tdb.slc.std',
      'deploy/@tdb.slc.data',
      'deploy/@tdb.slc.fs',
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
