import { type t, c, Fs, makeTmpl, Templates, TmplEngine } from '../-test.ts';

type StringDirname = string;

export function logTemplate(name: t.TemplateName, res: t.TmplWriteResult) {
  console.info(c.brightCyan(`Template: ${name}`));
  console.info();
  console.info(TmplEngine.Log.table(res.ops));
  console.info();
}

/**
 * Create a bare sample monorepo with a single package folder.
 */
export const makeWorkspace = async (ns: StringDirname, dirname: StringDirname) => {
  const tmp = await Fs.makeTempDir({ prefix: 'workspace-' });
  const root = tmp.absolute;
  const pkgDir = Fs.join(root, 'code', ns, dirname);

  const name: t.TemplateName = 'workspace';
  const def = await Templates[name]();
  const tmpl = await makeTmpl(name);

  const result = await tmpl.write(root);
  await def.default(root);

  const ls = async () => (await Fs.glob(tmp.absolute).find('**')).map((m) => m.path);
  return { root, pkgDir, tmp, ls, write: { result } } as const;
};

/**
 * Create a monorepo and run pkg.deno to scaffold a package inside it.
 */
export const makeWorkspaceWithPkg = async (
  ns = 'ns',
  name = 'my-module',
  pkgName = '@my-scope/foo',
) => {
  const test = await makeWorkspace(ns, name);
  const def = await Templates['pkg.deno']();
  const tmpl = await makeTmpl('pkg.deno');

  const res = await tmpl.write(test.pkgDir, { force: true });
  await def.default(test.pkgDir, { pkgName });

  const ls = async () => (await Fs.glob(test.root).find('**')).map((m) => m.path);
  return { ...test, res, ls } as const;
};
