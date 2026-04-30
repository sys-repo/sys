import { json } from '../-bundle.ts';
import { type FileMapProcessor, Fs, TmplEngine, Update } from '../common.ts';
import type { CellTmpl } from '../t.ts';
import { ROOTS } from './u.roots.ts';

export function makeTmpl(name: CellTmpl.Name = 'default') {
  const root = ROOTS[name];
  const processFile: FileMapProcessor = async (e) => {
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

/**
 * Helpers:
 */

function mergeGitignore(text: string, entries: readonly string[]) {
  const existing = new Set(gitignoreLines(text));
  const missing = entries.filter((entry) => !existing.has(entry));
  if (missing.length === 0) return text;
  return appendLines(text, missing);
}

function appendLines(text: string, lines: readonly string[]) {
  if (text.trim().length === 0) return `${lines.join('\n')}\n`;

  const update = Update.lines(text, (line) => {
    if (!line.is.last) return;
    const position = line.text.length === 0 ? 'before' : 'after';
    for (const item of lines) line.insert(item, position);
  });
  return update.after;
}

function gitignoreLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}
