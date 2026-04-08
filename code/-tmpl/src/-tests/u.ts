import { type t, c, Fs, Json, makeTmpl, Templates, TmplEngine } from '../-test.ts';

export { Fmt } from './u.fmt.ts';

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
export const makeWorkspace = async (options: { workspace?: string[] } = {}) => {
  const tmp = await Fs.makeTempDir({ prefix: 'workspace-' });
  const root = tmp.absolute;
  const workspace = options.workspace ?? [];
  await Fs.ensureDir(Fs.join(root, '-scripts'));
  await Fs.ensureDir(Fs.join(root, 'code'));
  await Fs.write(
    Fs.join(root, 'deno.json'),
    Json.stringify({ workspace }) + '\n',
  );

  for (const path of workspace) {
    const dir = Fs.join(root, path);
    const name = path.split('/').at(-1) ?? 'sample';
    await Fs.ensureDir(dir);
    await Fs.writeJson(Fs.join(dir, 'deno.json'), {
      name: `@test/${name}`,
      version: '0.0.0',
    });
  }

  const ls = async () => (await Fs.glob(tmp.absolute).find('**')).map((m) => m.path);
  return { root, tmp, ls } as const;
};

/**
 * Create a monorepo and run pkg to scaffold a package inside it.
 */
export const makeWorkspaceWithPkg = async (
  ns = 'ns',
  name = 'my-module',
  pkgName = '@my-scope/foo',
) => {
  const test = await makeWorkspace();
  const def = await Templates.pkg();
  const tmpl = await makeTmpl('pkg');
  const pkgDir = Fs.join(test.root, 'code', ns, name);

  const res = await tmpl.write(pkgDir, { force: true });
  await def.default(pkgDir, { pkgName });

  const ls = async () => (await Fs.glob(test.root).find('**')).map((m) => m.path);
  return { ...test, res, pkgDir, ls } as const;
};
