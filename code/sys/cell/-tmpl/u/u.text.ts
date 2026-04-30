import { Is, type t } from '../../src/common.ts';
import { json } from '../-bundle.ts';
import { type CellTemplateName, ROOTS } from './u.roots.ts';

export function readCellTmplDataUri(
  name: CellTemplateName = 'default',
  path: t.StringPath,
): string {
  const root = ROOTS[name];
  const key = `${root}/${path}`;
  const data = json[key];

  if (!Is.str(data)) throw new Error(`CellTmpl.text: template path not found: ${key}`);

  return data;
}

export async function readCellTmplText(
  name: CellTemplateName = 'default',
  path: t.StringPath,
): Promise<string> {
  const dataUri = readCellTmplDataUri(name, path);
  const res = await fetch(dataUri);
  return await res.text();
}
