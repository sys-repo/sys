import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { Str } from '../common.ts';
import { main, renderPaths } from '../task.prep.paths.ts';

describe('scripts/task.prep.paths', () => {
  it('renders one indented array line per path', () => {
    expect(renderPaths(['code/a', 'deploy/app'])).to.eql(["    'code/a',", "    'deploy/app',"]);
  });

  it('rewrites only the generated PATHS region', async () => {
    const fs = await Testing.dir('scripts.task.prep.paths.write');
    const path = fs.join('-PATHS.ts');
    await Fs.write(
      path,
      Str.dedent(`
        export const Paths = {
          all: [
            // generated:start workspace-topological
            'stale/a',
            'stale/b',
            // generated:end workspace-topological
          ],
        } as const;
      `),
    );

    const changed = await main(path, ['code/a', 'code/b']);
    const after = (await Fs.readText(path)).data ?? '';

    expect(changed).to.eql(true);
    expect(after).to.include("    'code/a',\n    'code/b',");
    expect(after).to.not.include('stale/a');
    expect(after).to.include('// generated:start workspace-topological');
    expect(after).to.include('// generated:end workspace-topological');
  });

  it('fails loudly when the generated markers are missing', async () => {
    const fs = await Testing.dir('scripts.task.prep.paths.missing-markers');
    const path = fs.join('-PATHS.ts');
    await Fs.write(path, 'export const Paths = { all: [] };\n');

    let error: unknown;
    try {
      await main(path, ['code/a']);
    } catch (err) {
      error = err;
    }

    expect(String(error)).to.include('missing generated markers');
  });
});
