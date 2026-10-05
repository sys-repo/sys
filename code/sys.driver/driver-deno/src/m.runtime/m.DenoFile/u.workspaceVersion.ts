import { type t } from './common.ts';
import { workspace } from './u.workspace.ts';

export async function workspaceVersion(
  name: t.StringPkgName,
  src?: t.StringPath,
  options?: t.DenoFile.Workspace.Options,
): Promise<t.StringSemver | undefined> {
  const ws = await workspace(src, options);
  const found = ws.children.find((child) => child.pkg.name === name);
  return found?.pkg.version;
}
