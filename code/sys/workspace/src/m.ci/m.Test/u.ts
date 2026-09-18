import { Err, Fs, Is, Json, type t } from '../common.ts';
import { WorkflowSafe } from '../u/u.safe.ts';
import { TEST_MATRIX_ITEM_TEMPLATE } from './u.tmpl.ts';

export async function loadModule(cwd: t.StringDir, path: t.StringPath) {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const file = await loadJson(resolved);
  const name = file.name;
  return { path, name: Is.str(name) && name ? name : path, file } as const;
}

export async function loadLinuxModule(cwd: t.StringDir, path: t.StringPath) {
  const module = await loadModule(cwd, path);
  const browser = wrangle.browser(module.file);
  if (browser && !wrangle.hasTask(module.file, 'test:browser')) {
    throw Err.std(`Browser-marked module is missing task "test:browser": ${path}`);
  }
  return { path: module.path, name: module.name, browser } as const;
}

export function toMatrixItemYaml(module: { path: t.StringPath; name: string; browser?: boolean }) {
  const name = WorkflowSafe.scalar(module.name, 'matrix name');
  const path = WorkflowSafe.scalar(module.path, 'matrix path');
  const yaml = TEST_MATRIX_ITEM_TEMPLATE.replace(/NAME/g, name).replace(/PATH/g, path);
  return module.browser ? `${yaml}\n  browser: true` : yaml;
}

async function loadJson(path: string) {
  try {
    const text = (await Fs.readText(path)).data ?? '';
    return Json.parse(text) as { name?: unknown; tasks?: unknown; 'x-sys'?: unknown };
  } catch (cause) {
    throw Err.std(`Failed to load module deno.json: ${path}`, { cause });
  }
}

const wrangle = {
  browser(file: { 'x-sys'?: unknown }) {
    const sys = wrangle.record(file['x-sys']);
    const ci = wrangle.record(sys?.ci);
    const test = wrangle.record(ci?.test);
    return test?.browser === true;
  },

  hasTask(file: { tasks?: unknown }, name: string) {
    const tasks = wrangle.record(file.tasks);
    return Is.str(tasks?.[name]) && Boolean(tasks[name]);
  },

  record(input: unknown) {
    return Is.record<Record<string, unknown>>(input) ? input : undefined;
  },
} as const;
