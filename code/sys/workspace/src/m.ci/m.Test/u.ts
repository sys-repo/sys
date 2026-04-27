import { type t, Err, Fs, Is, Json } from '../common.ts';
import { TEST_MATRIX_ITEM_TEMPLATE } from './u.tmpl.ts';

export async function loadModule(cwd: t.StringDir, path: t.StringPath) {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const file = await loadJson(resolved);

  const name = file.name;
  const browser = wrangle.browser(file);
  return { path, name: Is.str(name) && name ? name : path, browser } as const;
}

export function toMatrixItemYaml(module: { path: t.StringPath; name: string; browser?: boolean }) {
  const yaml = TEST_MATRIX_ITEM_TEMPLATE.replace(/NAME/g, module.name).replace(/PATH/g, module.path);
  return module.browser ? `${yaml}\n  browser: true` : yaml;
}

async function loadJson(path: string) {
  try {
    const text = (await Fs.readText(path)).data ?? '';
    return Json.parse(text) as { name?: unknown; 'x-sys'?: unknown };
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

  record(input: unknown) {
    return Is.record<Record<string, unknown>>(input) ? input : undefined;
  },
} as const;
