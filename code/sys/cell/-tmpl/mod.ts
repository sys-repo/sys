import type { FileMapProcessor } from '@sys/fs/t';
import { Fs, TmplEngine } from '@sys/tmpl-engine';
import { json } from './-bundle.ts';

export type CellTemplateName = keyof typeof ROOTS;

const SOURCE_PREFIX = 'cell.';
const ROOTS = {
  blank: 'cell.blank',
} as const;

export const CellTmpl = {
  names: Object.keys(ROOTS) as CellTemplateName[],
  make: makeCellTmpl,
  bundle: bundleCellTmpl,
} as const;

export function makeCellTmpl(name: CellTemplateName = 'blank') {
  const root = ROOTS[name];
  const processFile: FileMapProcessor = (e) => {
    if (!e.path.startsWith(`${root}/`)) return;

    const relative = e.path.slice(root.length + 1);
    if (!relative) return e.skip('empty template path');
    e.target.rename(relative, true);
  };

  return TmplEngine
    .makeTmpl(json, processFile)
    .filter((e) => e.path.startsWith(`${root}/`));
}

export async function bundleCellTmpl() {
  const root = Fs.resolve(import.meta.dirname ?? '.');
  const res = await TmplEngine.bundle(root, {
    targetFile: Fs.join(root, '-bundle.json'),
    filter: (e) => e.path.startsWith(SOURCE_PREFIX),
  });
  console.info(TmplEngine.Log.bundled(res));
  return res;
}

if (import.meta.main) {
  await bundleCellTmpl();
}
