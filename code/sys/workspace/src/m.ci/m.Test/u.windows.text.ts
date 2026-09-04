import { Fs, type t } from '../common.ts';
import { CI_DENO_VERSION } from '../u.deno.ts';
import { wrangle } from '../u/u.yaml.ts';
import { loadWindowsModule } from './u.windows.module.ts';
import { WINDOWS_TEST_WORKFLOW_TEMPLATE } from './u.windows.tmpl.ts';
import { toWindowsMatrixItemYaml } from './u.windows.yaml.ts';

export async function text(args: t.WorkspaceCi.Test.Windows.Args) {
  const cwd = args.cwd ?? Fs.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadWindowsModule(cwd, path)));
  const items = modules.length
    ? modules.map((module) => wrangle.indent(toWindowsMatrixItemYaml(module), 10)).join('\n')
    : '          []';

  return `${
    WINDOWS_TEST_WORKFLOW_TEMPLATE
      .replace('__ON__', wrangle.on(args.on))
      .replace('__MATRIX_ITEMS__', items)
      .replace('__DENO_VERSION__', CI_DENO_VERSION)
  }\n`;
}
