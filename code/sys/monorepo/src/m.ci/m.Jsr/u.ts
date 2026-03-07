import { type t, DenoFile, Err, Fs, Is } from '../common.ts';
import { JSR_BODY_TEMPLATE } from './u.tmpl.ts';

export async function loadModule(cwd: t.StringDir, path: t.StringPath) {
  const resolved = Fs.resolve(cwd, path);
  const file = await DenoFile.load(resolved);
  if (!file.ok) {
    throw Err.std(`Failed to load module deno.json: ${resolved}`, { cause: file.error });
  }

  const name = file.data?.name;
  if (!Is.str(name) || !name) throw new Error(`Module deno.json is missing "name": ${file.path}`);

  return { path, name } as const;
}

export function toModuleYaml(module: { path: t.StringPath; name: string }) {
  return JSR_BODY_TEMPLATE.replace(/NAME/g, module.name).replace(/PATH/g, module.path);
}
