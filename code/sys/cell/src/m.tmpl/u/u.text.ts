import { FileMap, Is, type t } from '../common.ts';
import { json } from '../-bundle.ts';
import type { CellTmpl } from '../t.ts';
import { ROOTS } from './u.roots.ts';

export function readTmplDataUri(name: CellTmpl.Name, path: t.StringPath): string {
  const root = ROOTS[name];
  const key = `${root}/${path}`;
  const data = json[key];

  if (!Is.str(data)) throw new Error(`CellTmpl.text: template path not found: ${key}`);

  return data;
}

export async function readTmplText(name: CellTmpl.Name, path: t.StringPath): Promise<string> {
  const dataUri = readTmplDataUri(name, path);
  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`CellTmpl.text: template path is not text: ${path}`);
  return data;
}
