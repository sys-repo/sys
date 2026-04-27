import type { t } from '../common.ts';
import { workflowTemplate, wrangle } from '../u.workflow.ts';
import { loadModule, toMatrixItemYaml } from './u.ts';
import { TEST_BODY_TEMPLATE, TEST_JOB_CONFIG_TEMPLATE } from './u.tmpl.ts';

export async function text(args: t.WorkspaceCi.Test.Args) {
  const cwd = args.cwd ?? Deno.cwd();
  const browserPaths = new Set(args.browserPaths ?? []);
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  const items = modules.length
    ? modules
      .map((module) => ({ ...module, browser: browserPaths.has(module.path) }))
      .map((module) => wrangle.indent(toMatrixItemYaml(module), 10)).join('\n')
    : '          []';
  return `${workflowTemplate({
    name: 'test',
    permissions: { contents: 'read' },
    on: args.on,
    env: args.env,
    jobConfig: TEST_JOB_CONFIG_TEMPLATE.replace('__MATRIX_ITEMS__', items),
    body: TEST_BODY_TEMPLATE,
  })}\n`;
}
