import { type t, c, Fs, makeTmpl, Templates, TmplEngine } from '../-test.ts';

type StringDirname = string;

export function logTemplate(
  name: t.TemplateName,
  res: t.TmplWriteResult,
  options: { titleSuffix?: string } = {},
) {
  let title = `Template: ${name}`;
  if (options.titleSuffix) title += ` ${options.titleSuffix}`;

  console.info(c.brightCyan(title));
  console.info();
  console.info(TmplEngine.Log.table(res.ops));
  console.info();
}

/**
 * Create a bare sample monorepo with a single package folder.
 */
export const makeWorkspace = async () => {
  const tmp = await Fs.makeTempDir({ prefix: 'workspace-' });
  const root = tmp.absolute;

  const name: t.TemplateName = 'workspace';
  const def = await Templates[name]();
  const tmpl = await makeTmpl(name);

  const result = await tmpl.write(root);
  await def.default(root);

  const ls = async () => (await Fs.glob(tmp.absolute).find('**')).map((m) => m.path);
  return { root, tmp, ls, write: { result } } as const;
};

/**
 * Create a monorepo and run pkg.deno to scaffold a package inside it.
 */
export const makeWorkspaceWithPkg = async (
  ns = 'ns',
  name = 'my-module',
  pkgName = '@my-scope/foo',
) => {
  const test = await makeWorkspace();
  const def = await Templates['pkg.deno']();
  const tmpl = await makeTmpl('pkg.deno');
  const pkgDir = Fs.join(test.root, 'code', ns, name);

  const res = await tmpl.write(pkgDir, { force: true });
  await def.default(pkgDir, { pkgName });

  const ls = async () => (await Fs.glob(test.root).find('**')).map((m) => m.path);
  return { ...test, res, pkgDir, ls } as const;
};
