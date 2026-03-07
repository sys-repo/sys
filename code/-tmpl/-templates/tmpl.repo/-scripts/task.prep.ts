import { Fs, Path } from '@sys/fs';
import { Json } from '@sys/std';
import { MonorepoCi as Ci } from '@sys/monorepo/ci';

const PATHS = {
  projects: 'code/projects',
  build: '.github/workflows/build.yaml',
  test: '.github/workflows/test.yaml',
} as const;

export async function main(cwd = Deno.cwd()) {
  const buildPaths = await findTaskPaths(cwd, 'build');
  const testPaths = await findTaskPaths(cwd, 'test');
  const on = { pull_request: ['main'], push: ['main'] } as const;

  await writeWorkflow({
    cwd,
    paths: buildPaths,
    target: PATHS.build,
    write: Ci.Build.write,
    on,
  });
  await writeWorkflow({
    cwd,
    paths: testPaths,
    target: PATHS.test,
    write: Ci.Test.write,
    on,
  });
}

async function writeWorkflow(args: {
  cwd: string;
  on: { pull_request: readonly string[]; push: readonly string[] };
  paths: readonly string[];
  target: string;
  write: (args: {
    cwd: string;
    on: { pull_request: readonly string[]; push: readonly string[] };
    paths: readonly string[];
    target: string;
  }) => Promise<unknown>;
}) {
  const abs = Fs.resolve(args.cwd, args.target);
  if (args.paths.length === 0) {
    if (await Fs.exists(abs)) {
      await Fs.remove(abs);
      console.info(`Removed file: ${args.target}`);
    }
    return;
  }

  await args.write({ cwd: args.cwd, on: args.on, paths: args.paths, target: args.target });
  console.info(`Updated file: ${args.target}`);
}

async function findTaskPaths(cwd: string, task: 'build' | 'test') {
  const root = Fs.resolve(cwd, PATHS.projects);
  if (!(await Fs.exists(root))) return [];

  const entries = await Fs.glob(root, { includeDirs: false }).find('**/deno.json');
  const found: string[] = [];

  for (const entry of entries) {
    const deno = await readJson(entry.path);
    if (!hasTask(deno, task)) continue;
    found.push(toRelative(cwd, Path.dirname(entry.path)));
  }

  return found.sort();
}

function hasTask(value: unknown, key: 'build' | 'test') {
  if (!value || typeof value !== 'object') return false;
  const tasks = (value as { tasks?: Record<string, unknown> }).tasks;
  return typeof tasks?.[key] === 'string' && !!tasks[key];
}

async function readJson(path: string) {
  return Json.parse(await Deno.readTextFile(path));
}

function toRelative(cwd: string, path: string) {
  return Path.relative(cwd, path).replaceAll('\\', '/');
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
