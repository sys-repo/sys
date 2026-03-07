import type { t } from '../common.ts';
import { JSR_TEMPLATE } from './u.tmpl.ts';
import { loadModule, toModuleYaml } from './u.ts';
import { wrangle } from '../u.workflow.ts';

export async function text(args: t.MonorepoCi.Jsr.TextArgs) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  let body = '';

  for (const module of modules) {
    const item = wrangle.indent(toModuleYaml(module), 6);
    body += `${body ? '\n\n' : ''}${item}`;
  }

  return `${JSR_TEMPLATE.replace('__MODULES__', body)}\n`;
}
