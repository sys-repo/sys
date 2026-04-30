import { FileMap, Fs, Path, type t } from '../common.ts';
import { json } from '../-bundle.ts';
import type { CellTmpl } from '../t.ts';
import { GITIGNORE_ENTRIES, GITIGNORE_PATH, mergeGitignore } from './u.gitignore.ts';
import { ROOTS } from './u.roots.ts';

export async function writeTmpl(
  name: CellTmpl.Name,
  target: string,
  options: CellTmpl.Write.Options = {},
): Promise<CellTmpl.Write.Result> {
  const root = ROOTS[name];
  const targetDir = Fs.resolve(target);
  const dryRun = options.dryRun === true;
  const fileMap = FileMap.filter(json, (e) => e.path.startsWith(`${root}/`));

  const res = await FileMap.write(fileMap, targetDir as t.StringDir, {
    dryRun,
    processFile: processTmplFile(root),
  });

  return { target: targetDir, dryRun, ops: res.ops, total: res.total };
}

function processTmplFile(root: string): t.FileMapProcessor {
  return async (e) => {
    const relative = e.path.slice(root.length + 1);
    assertSafeRelativePath(relative);
    e.target.rename(relative as t.StringPath, true);

    if (relative !== GITIGNORE_PATH) return;
    if (!(await e.target.exists())) return;

    const read = await Fs.readText(e.target.absolute);
    if (!read.ok) throw read.error;

    const before = read.data ?? '';
    const after = mergeGitignore(before, GITIGNORE_ENTRIES);
    if (after !== before) e.modify(after);
  };
}

function assertSafeRelativePath(path: string) {
  if (!path) throw new Error('Cell template contains an empty path.');
  if (Path.Is.absolute(path)) throw new Error(`Cell template path must be relative: ${path}`);
  if (path.split('/').includes('..')) throw new Error(`Cell template path escapes root: ${path}`);
}
