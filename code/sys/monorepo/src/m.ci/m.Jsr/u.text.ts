import type { t } from '../common.ts';
import { JSR_HEADER_TEMPLATE } from '../u.tmpl/mod.ts';
import { loadModule, toModuleYaml } from './u.ts';

export async function text(args: t.MonorepoCi.Jsr.TextArgs) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  let yaml = JSR_HEADER_TEMPLATE;

  for (const module of modules) {
    const item = wrangle.indent(toModuleYaml(module), 6);
    yaml += `\n\n${item}`;
  }

  return `${yaml}\n`;
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
