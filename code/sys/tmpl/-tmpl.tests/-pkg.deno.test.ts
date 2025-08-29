import { type t, describe, expect, it, Templates, Testing } from '../src/-test.ts';
import { DenoFile, Fs } from './common.ts';

/**
 * Scaffold:
 */
export const setup = async (
  options: { pkgName?: string; pkgDir?: string; write?: boolean; fs?: t.TestingDir } = {},
) => {
  const fs = options.fs ?? (await Testing.dir('pkg.deno').create());
  const pkgDir = options.pkgDir ?? 'code/pkg-dir';
  const pkgName = options.pkgName ?? '@sample/foo';

  const def = await Templates['pkg.deno']();

  // Simulate key mono-repo environment:
  // (these are parts of the environment that are updated when the template is run).
  const monorepo = await DenoFile.nearest('.', (e) => Array.isArray(e.file.workspace));

  for (const path of ['deno.json', '-scripts/u.paths.ts']) {
    const from = Fs.join(monorepo?.dir ?? '', path);
    const to = Fs.join(fs.dir, path);
    await Fs.copy(from, to);
  }

  if (options.write ?? true) {
    await def.tmpl.write(fs.join(pkgDir), { afterWrite: (e) => def.default(e, { pkgName }) });
  }

  return { fs, def, pkgName, pkgDir } as const;
};

describe('Template: pkg.deno', () => {
  it('setup', async () => {
    const pkgName = '@sample/foo';
    const pkgDir = 'code/pkg-dir';
    const { fs, def } = await setup({ pkgName, pkgDir });

    const glob = await Fs.glob(def.dir!).find('**', { trimCwd: true, includeDirs: false });
    const paths = glob
      .map((m) => m.path.slice('src/-tmpl/pkg.deno/'.length))
      .map((p) => Fs.join(pkgDir, p))
      .filter((p) => !p.endsWith('.tmpl.ts'))
      .filter((p) => !p.endsWith('-deno.json'));

    const ls = await fs.ls(true);
    expect(ls.includes('deno.json')).to.be.true; // NB: renamed from `-deno.json`
    for (const path of paths.filter((p) => p.startsWith(pkgDir))) {
      expect(ls.includes(path)).to.eql(true, path);
    }

    const read = async (path: string) => (await Fs.readText(fs.join(path))).data!;
    const scriptFile = await read('code/pkg-dir/-scripts/-clean.ts');
    expect(scriptFile).to.include(`import { Fs } from '@sys/fs'`);

    const workspaceDenofile = await read('deno.json');
    expect(workspaceDenofile).to.include(`"workspace": [\n    "${pkgDir}",\n`);
  });
});
