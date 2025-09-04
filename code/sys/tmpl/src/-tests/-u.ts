import { type t, Fs, Templates, makeTmpl } from '../-test.ts';

type StringDirname = string;

/**
 * Create a bare sample monorepo with a single package folder.
 */
export const makeSampleMonorepo = async (ns: StringDirname, dirname: StringDirname) => {
  const tmp = await Fs.makeTempDir({ prefix: 'monorepo-' });
  const root = tmp.absolute;
  const pkgDir = Fs.join(root, 'code', ns, dirname);

  const write = async (path: t.ObjectPath, text: string) => {
    const target = Fs.join(...path.map(String));
    await Fs.write(target, text, { force: true });
  };

  await Fs.ensureDir(pkgDir);
  await Fs.ensureDir(Fs.join(root, '-scripts'));

  // Monorepo workspace definition:
  const denofile = { workspace: [] };
  const denofileJson = JSON.stringify(denofile, null, 2).replace(/\]/, '\n  ]');

  await write([root, 'deno.json'], denofileJson);
  await write([root, '-scripts', '-PATHS.ts'], 'export const PATHS = {};\n');

  const ls = async () => (await Fs.glob(tmp.absolute).find('**')).map((m) => m.path);
  return { root, pkgDir, tmp, ls } as const;
};

/**
 * Create a monorepo and run pkg.deno to scaffold a package inside it.
 */
export const makeWorkspaceWithPkg = async (
  ns = 'ns',
  name = 'my-module',
  pkgName = '@my-scope/foo',
) => {
  const test = await makeSampleMonorepo(ns, name);

  const def = await Templates['pkg.deno']();
  const tmpl = await makeTmpl('pkg.deno');

  const res = await tmpl.write(test.pkgDir, { force: true });
  await def.default(test.pkgDir, { pkgName });

  const ls = async () => (await Fs.glob(test.root).find('**')).map((m) => m.path);
  return { ...test, res, ls } as const;
};
