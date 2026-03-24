import { c, Fs, Json, Path, Str, type t } from './common.ts';

export async function resolveSourcePaths(
  cwd: t.StringDir,
  source: t.WorkspaceCi.Source,
  options: { task?: 'build' | 'test'; named?: boolean },
) {
  if ('paths' in source) {
    const include = (path: string) => shouldInclude(cwd, path, options);
    const results = await Promise.all(
      source.paths.map(async (path) => ({ path, include: await include(path) })),
    );
    return results.filter((item) => item.include).map((item) => item.path);
  }

  const root = Fs.resolve(cwd, source.root);
  if (!(await Fs.exists(root))) return [];

  const entries = await Fs.glob(root, { includeDirs: false }).find('**/deno.json');
  const found: string[] = [];

  for (const entry of entries) {
    const deno = await loadJson(entry.path);
    if (options.task && !hasTask(deno, options.task)) continue;
    if (options.named && !hasName(deno)) continue;
    found.push(toRelative(cwd, Fs.dirname(entry.path)));
  }

  return found.sort();
}

export async function removeIfExists(cwd: t.StringDir, target: t.StringPath) {
  const abs = Fs.resolve(cwd, target);
  if (!(await Fs.exists(abs))) return false;
  await Fs.remove(abs);
  return true;
}

export function logSyncResult(
  subject: 'build' | 'test' | 'jsr',
  result: t.WorkspaceCi.SyncResult,
  options: { log?: boolean } = {},
) {
  if (!options.log) return;

  const label = Fs.trimCwd(result.target);
  const subjectLabel = subject === 'jsr' ? 'publish:jsr' : subject;
  const count = `${result.count} ${subjectLabel} ${Str.plural(result.count, 'module')}`;
  if (result.kind === 'written') {
    const msg = `${c.brightCyan('Updated file:')} ${c.gray(label)} ${c.white(`(${count})`)}`;
    console.info(msg);
    return;
  }

  if (result.kind === 'unchanged') {
    const msg = `${c.gray('Unchanged file:')} ${c.gray(label)} ${c.white(`(${count})`)}`;
    console.info(msg);
    return;
  }

  if (result.kind === 'removed') {
    console.info(`${c.cyan('Removed file:')} ${c.gray(label)}`);
    return;
  }

  console.info(`${c.gray('Skipped file:')} ${c.gray(label)}`);
}

function hasTask(value: unknown, key: 'build' | 'test') {
  if (!value || typeof value !== 'object') return false;
  const tasks = (value as { tasks?: Record<string, unknown> }).tasks;
  return typeof tasks?.[key] === 'string' && !!tasks[key];
}

function hasName(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const name = (value as { name?: unknown }).name;
  return typeof name === 'string' && !!name;
}

async function shouldInclude(
  cwd: t.StringDir,
  path: t.StringPath,
  options: { task?: 'build' | 'test'; named?: boolean },
) {
  const filepath = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  if (!(await Fs.exists(filepath))) return false;
  const data = await loadJson(filepath);
  if (!data) return false;
  if (options.task && !hasTask(data, options.task)) return false;
  if (options.named && !hasName(data)) return false;
  return true;
}

async function loadJson(path: string) {
  return Json.parse((await Fs.readText(path)).data ?? '');
}

function toRelative(cwd: string, path: string) {
  return Path.relative(cwd, path).replaceAll('\\', '/');
}
