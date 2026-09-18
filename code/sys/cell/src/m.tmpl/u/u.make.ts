import { json } from '../-bundle/-bundle.ts';
import type { CellTmpl } from '../t.ts';
import { Fs, Path, type t, TmplEngine } from './common.ts';
import { GITIGNORE_ENTRIES, GITIGNORE_PATH, mergeGitignore } from './u.gitignore.ts';
import { ROOTS } from './u.roots.ts';

export function makeTmpl(name: CellTmpl.Name = 'default') {
  const root = ROOTS[name];
  const processFile: t.TmplProcessFile = async (e) => {
    if (!e.path.startsWith(`${root}/`)) return;

    const relative = e.path.slice(root.length + 1);
    if (!relative) return e.skip('empty template path');
    assertSafeRelativePath(relative);
    e.target.rename(relative, true);

    if (relative !== GITIGNORE_PATH) return;
    if (!(await e.target.exists())) return;

    const read = await Fs.readText(e.target.absolute);
    if (!read.ok) throw read.error;

    const text = read.data ?? '';
    const next = mergeGitignore(text, GITIGNORE_ENTRIES);
    if (next !== text) e.modify(next);
  };

  return TmplEngine
    .makeTmpl(json, processFile)
    .filter((e) => e.path.startsWith(`${root}/`));
}

function assertSafeRelativePath(path: string) {
  if (!path) throw new Error('Cell template contains an empty path.');
  if (Path.Is.absolute(path)) throw new Error(`Cell template path must be relative: ${path}`);
  if (path.split('/').includes('..')) throw new Error(`Cell template path escapes root: ${path}`);
}
