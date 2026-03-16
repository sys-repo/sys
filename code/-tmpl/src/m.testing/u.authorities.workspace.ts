import { type t, DenoFile, Fs, Is, Obj } from './common.ts';
import { readImportMap, readPackageJson } from './u.authorities.read.ts';
import { toExportSpecifiers, toNpmImportSpecifiers } from './u.authorities.imports.ts';

const workspaceAuthorities = new Map<string, Promise<t.WorkspaceAuthorities>>();

export async function resolveWorkspaceRoot(
  workspaceRoot?: t.StringAbsoluteDir,
): Promise<t.StringAbsoluteDir> {
  if (Is.str(workspaceRoot) && workspaceRoot.length > 0) return workspaceRoot;

  const ws = await DenoFile.workspace();
  if (!ws.exists) throw new Error('Workspace not found for local repo authority rewrite.');
  return ws.dir as t.StringAbsoluteDir;
}

export async function loadWorkspaceAuthorities(root: t.StringAbsoluteDir): Promise<t.WorkspaceAuthorities> {
  const key = root;
  const pending = workspaceAuthorities.get(key) ?? buildWorkspaceAuthorities(root);
  workspaceAuthorities.set(key, pending);
  return await pending;
}

async function buildWorkspaceAuthorities(root: t.StringAbsoluteDir): Promise<t.WorkspaceAuthorities> {
  const rootImports = await readImportMap(Fs.join(root, 'imports.json'));
  const rootPackage = await readPackageJson(Fs.join(root, 'package.json'));
  const workspace = await DenoFile.workspace(Fs.join(root, 'deno.json'), { walkup: false });
  const imports: Record<string, string> = {
    ...rootImports.imports,
    ...toNpmImportSpecifiers(rootPackage),
  };

  for (const child of workspace.children) {
    const deno = child.denofile as t.ModuleDeno;
    if (!(Is.str(deno.name) && deno.name.startsWith('@sys/'))) continue;

    for (const [specifier, target] of Obj.entries(toExportSpecifiers(deno.name, deno.exports))) {
      imports[specifier] = Fs.join(root, child.path.dir, target);
    }
  }

  return { imports, packageJson: rootPackage };
}
