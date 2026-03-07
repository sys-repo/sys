import type { t } from '../common.ts';
import { BUILD_HEADER_TEMPLATE } from '../u.tmpl/mod.ts';
import { loadModule, toMatrixItemYaml } from './u.ts';

export async function text(args: t.MonorepoCi.Build.Args) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  const items = modules.length
    ? modules.map((module) => wrangle.indent(toMatrixItemYaml(module), 10)).join('\n')
    : '          []';
  return `${BUILD_HEADER_TEMPLATE.replace('__MATRIX_ITEMS__', items)}\n`;
}

const wrangle = {
  indent(text: string, indent: number) {
    return text
      .split('\n')
      .map((line) => `${' '.repeat(indent)}${line}`)
      .filter((line) => (!line.trim() ? line.trim() : line))
      .join('\n');
  },
} as const;
