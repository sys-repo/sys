import type { t } from '../common.ts';
import { BUILD_TEMPLATE } from './u.tmpl.ts';
import { loadModule, toMatrixItemYaml } from './u.ts';
import { wrangle } from '../u.workflow.ts';

export async function text(args: t.MonorepoCi.Build.Args) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  const items = modules.length
    ? modules.map((module) => wrangle.indent(toMatrixItemYaml(module), 10)).join('\n')
    : '          []';
  return `${BUILD_TEMPLATE.replace('__MATRIX_ITEMS__', items)}\n`;
}
