import { DenoFile, Err, Fs, Is, type t } from '../common.ts';
import { JSR_BODY_TEMPLATE } from './u.tmpl.ts';

export type Module = {
  readonly path: t.StringPath;
  readonly name: t.StringPkgName;
  readonly version: t.StringSemver;
};

export async function loadModule(cwd: t.StringDir, path: t.StringPath): Promise<Module> {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const res = await DenoFile.load(resolved);
  const file = res.data;
  if (!res.ok || !file) {
    const cause = res.error;
    throw Err.std(`Failed to load module deno.json: ${resolved}`, { cause });
  }

  const name = file.name;
  if (!Is.str(name) || !name) {
    throw new Error(`Module deno.json is missing "name": ${resolved}`);
  }
  const version = file.version;
  if (!Is.str(version) || !version) {
    throw new Error(`Module deno.json is missing "version": ${resolved}`);
  }

  return {
    path,
    name,
    version,
  } as const;
}

export function toModuleYaml(module: Pick<Module, 'path' | 'name'>) {
  return JSR_BODY_TEMPLATE.replace(/NAME/g, module.name).replace(/PATH/g, module.path);
}
