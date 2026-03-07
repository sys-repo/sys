import { c, type t, Fs, Json, Path } from './common.ts';

export async function resolveSourcePaths(
  cwd: t.StringDir,
  source: t.MonorepoCi.Source,
  options: { task?: "build" | "test"; named?: boolean },
) {
  if ('paths' in source) return [...source.paths];

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
  result: t.MonorepoCi.SyncResult,
  options: { log?: boolean } = {},
) {
  if (!options.log) return;

  const label = c.gray(result.target);
  if (result.kind === 'written') {
    const count = c.white(`${result.count}`);
    console.info(`${c.green('Updated file:')} ${label} ${c.gray(`(${count} ${subject} module(s))`)}`);
    return;
  }

  if (result.kind === 'removed') {
    console.info(`${c.yellow('Removed file:')} ${label}`);
    return;
  }

  console.info(`${c.gray('Skipped file:')} ${label}`);
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

async function loadJson(path: string) {
  return Json.parse(await Deno.readTextFile(path));
}

function toRelative(cwd: string, path: string) {
  return Path.relative(cwd, path).replaceAll('\\', '/');
}
