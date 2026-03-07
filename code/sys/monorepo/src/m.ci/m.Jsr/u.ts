import { type t, Err, Fs, Is, Json } from '../common.ts';
import { JSR_BODY_TEMPLATE } from './u.tmpl.ts';

export async function loadModule(cwd: t.StringDir, path: t.StringPath) {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const file = await loadJson(resolved);

  const name = file.name;
  if (!Is.str(name) || !name) throw new Error(`Module deno.json is missing "name": ${resolved}`);

  return { path, name } as const;
}

export function toModuleYaml(module: { path: t.StringPath; name: string }) {
  return JSR_BODY_TEMPLATE.replace(/NAME/g, module.name).replace(/PATH/g, module.path);
}

async function loadJson(path: string) {
  try {
    return Json.parse(await Deno.readTextFile(path)) as { name?: unknown };
  } catch (cause) {
    throw Err.std(`Failed to load module deno.json: ${path}`, { cause });
  }
}
