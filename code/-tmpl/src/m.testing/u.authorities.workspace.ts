import { type t, DenoFile, Fs, Is, Obj } from './common.ts';
import {
  toExportSpecifiers,
  toNpmImportedSubpathSpecifiers,
  toNpmImportSpecifiers,
} from './u.authorities.imports.ts';
import { readImportMap, readPackageJson } from './u.authorities.read.ts';

const workspaceAuthorities = new Map<string, Promise<t.WorkspaceAuthorities>>();

export async function resolveWorkspaceRoot(
  workspaceRoot?: t.StringAbsoluteDir,
): Promise<t.StringAbsoluteDir> {
  if (Is.str(workspaceRoot) && workspaceRoot.length > 0) return workspaceRoot;

  const ws = await DenoFile.workspace();
  if (!ws.exists) throw new Error('Workspace not found for local repo authority rewrite.');
  return ws.dir as t.StringAbsoluteDir;
}

export async function loadWorkspaceAuthorities(
  root: t.StringAbsoluteDir,
): Promise<t.WorkspaceAuthorities> {
  const key = root;
  const pending = workspaceAuthorities.get(key) ?? buildWorkspaceAuthorities(root);
  workspaceAuthorities.set(key, pending);
  return await pending;
}

async function buildWorkspaceAuthorities(
  root: t.StringAbsoluteDir,
): Promise<t.WorkspaceAuthorities> {
  const rootImports = await readImportMap(Fs.join(root, 'imports.json'));
  const rootPackage = await readPackageJson(Fs.join(root, 'package.json'));
  const workspace = await DenoFile.workspace(Fs.join(root, 'deno.json'), { walkup: false });
  const bareImports = new Set<string>();
  const imports: Record<string, string> = {
    ...rootImports.imports,
    ...toNpmImportSpecifiers(rootPackage),
  };

  for (const child of workspace.children) {
    const deno = child.denofile as t.ModuleDeno;
    if (!(Is.str(deno.name) && deno.name.startsWith('@sys/'))) continue;

    const childImports = await findBareImports(Fs.join(root, child.path.dir));
    childImports.forEach((specifier) => bareImports.add(specifier));
    for (const [specifier, target] of Obj.entries(toExportSpecifiers(deno.name, deno.exports))) {
      imports[specifier] = Fs.join(root, child.path.dir, target);
    }
  }

  Object.assign(imports, toNpmImportedSubpathSpecifiers(rootPackage, bareImports));
  return { imports, packageJson: rootPackage };
}

async function findBareImports(root: string) {
  const specifiers = new Set<string>();
  const glob = Fs.glob(root);
  const files = await glob.find('**/*.{ts,tsx,js,jsx,mts,mtsx}', { includeDirs: false });

  for (const file of files) {
    const res = await Fs.readText(file.path);
    if (!res.ok || !res.data) continue;

    for (const specifier of parseBareImports(res.data)) {
      specifiers.add(specifier);
    }
  }

  return specifiers;
}

function parseBareImports(source: string) {
  const specifiers = new Set<string>();
  const pattern =
    /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(pattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;
    if (specifier.startsWith('.')) continue;
    if (specifier.startsWith('/')) continue;
    if (specifier.startsWith('file:')) continue;
    if (specifier.startsWith('http:')) continue;
    if (specifier.startsWith('https:')) continue;
    if (specifier.startsWith('jsr:')) continue;
    if (specifier.startsWith('npm:')) continue;
    if (specifier.startsWith('node:')) continue;
    specifiers.add(specifier);
  }

  return specifiers;
}
