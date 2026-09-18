import { Err, Fs, Is, Json, Path, type t } from '../common.ts';
import { hasTask } from '../u/u.source.ts';

export type WindowsTestModule = {
  readonly name: string;
  readonly path: t.StringPath;
};

export async function loadWindowsModule(
  cwd: t.StringDir,
  path: t.StringPath,
): Promise<WindowsTestModule> {
  const root = Fs.resolve(cwd);
  const absolute = Fs.resolve(root, path);
  if (!Path.Is.within(root, absolute)) throw outsideCwd(path);

  const physicalRoot = await realPath(root, 'cwd');
  const physicalModule = await realPath(absolute, 'module');
  if (!Path.Is.within(physicalRoot, physicalModule)) throw outsideCwd(path);

  const manifest = await realPath(Fs.join(physicalModule, 'deno.json'), 'module manifest');
  if (!Path.Is.within(physicalRoot, manifest)) throw outsideCwd(path);

  const relative = Path.relative(root, absolute).replaceAll('\\', '/') || '.';
  const file = await loadJson(manifest);
  if (!hasTask(file, 'test:windows')) {
    throw Err.std(`Windows test module is missing nonempty task "test:windows": ${relative}`);
  }

  const record = Is.record<Record<string, unknown>>(file) ? file : {};
  const name = record.name;
  return { path: relative, name: Is.str(name) && name ? name : relative };
}

function outsideCwd(path: t.StringPath) {
  return Err.std(`Windows test module path is outside cwd: ${path}`);
}

async function realPath(path: t.StringPath, kind: string) {
  try {
    return await Fs.realPath(path);
  } catch (cause) {
    throw Err.std(`Failed to resolve Windows test ${kind} path: ${path}`, { cause });
  }
}

async function loadJson(path: string) {
  try {
    const text = (await Fs.readText(path)).data ?? '';
    return Json.parse(text) as unknown;
  } catch (cause) {
    throw Err.std(`Failed to load Windows test module deno.json: ${path}`, { cause });
  }
}
