import { json } from '../-bundle.ts';
import { Fs, type Tmpl, TmplEngine } from './common.ts';
import type { CellTmpl } from '../t.ts';
import { mergeGitignore } from './u.gitignore.ts';
import { ROOTS } from './u.roots.ts';

export function makeTmpl(name: CellTmpl.Name = 'default') {
  const root = ROOTS[name];
  const processFile: Tmpl.TmplProcessFile = async (e) => {
    if (!e.path.startsWith(`${root}/`)) return;

    const relative = e.path.slice(root.length + 1);
    if (!relative) return e.skip('empty template path');
    e.target.rename(relative, true);

    if (relative !== '.gitignore') return;
    if (!(await e.target.exists())) return;

    const read = await Fs.readText(e.target.absolute);
    if (!read.ok) throw read.error;

    const text = read.data ?? '';
    const next = mergeGitignore(text, ['.env']);
    if (next !== text) e.modify(next);
  };

  return TmplEngine
    .makeTmpl(json, processFile)
    .filter((e) => e.path.startsWith(`${root}/`));
}
