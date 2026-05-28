import { Err, Fs, Is, Json, type t } from '../common.ts';
import { WorkflowSafe } from '../u/u.safe.ts';
import { BUILD_MATRIX_ITEM_TEMPLATE } from './u.tmpl.ts';

export async function loadModule(cwd: t.StringDir, path: t.StringPath) {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const file = await loadJson(resolved);

  const name = file.name;
  return { path, name: Is.str(name) && name ? name : path } as const;
}

export function toMatrixItemYaml(module: { path: t.StringPath; name: string }) {
  const name = WorkflowSafe.scalar(module.name, 'matrix name');
  const path = WorkflowSafe.scalar(module.path, 'matrix path');
  return BUILD_MATRIX_ITEM_TEMPLATE.replace(/NAME/g, name).replace(/PATH/g, path);
}

async function loadJson(path: string) {
  try {
    return Json.parse(await Deno.readTextFile(path)) as { name?: unknown };
  } catch (cause) {
    throw Err.std(`Failed to load module deno.json: ${path}`, { cause });
  }
}
