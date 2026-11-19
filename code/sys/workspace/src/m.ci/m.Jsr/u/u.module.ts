import { Err, Fs, Is, type t } from '../../common.ts';

export type Module = {
  readonly path: t.StringPath;
  readonly name: t.StringPkgName;
  readonly version: t.StringSemver;
  readonly cache: boolean;
};

type DenoJson = {
  readonly name?: string;
  readonly version?: string;
  readonly tasks?: unknown;
};

export async function loadModule(cwd: t.StringDir, path: t.StringPath): Promise<Module> {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const res = await Fs.readJson<DenoJson>(resolved);
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

  // Match Linux CI: a non-empty task declaration opts into package-owned preparation.
  const tasks = Is.record<Record<string, unknown>>(file.tasks) ? file.tasks : undefined;
  const task = tasks?.['test:cache'];
  const cache = Is.str(task) && task.trim().length > 0;

  return {
    path,
    name,
    version,
    cache,
  } as const;
}
