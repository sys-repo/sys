import type { t } from '../common.ts';
import { workflowTemplate, wrangle } from '../u.workflow.ts';
import { loadModule, toMatrixItemYaml } from './u.ts';
import { BUILD_BODY_TEMPLATE, BUILD_JOB_CONFIG_TEMPLATE } from './u.tmpl.ts';

export async function text(args: t.MonorepoCi.Build.Args) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  const items = modules.length
    ? modules.map((module) => wrangle.indent(toMatrixItemYaml(module), 10)).join('\n')
    : '          []';
  return `${workflowTemplate({
    name: 'build',
    permissions: { contents: 'read' },
    branches: args.branches,
    env: args.env,
    jobConfig: BUILD_JOB_CONFIG_TEMPLATE.replace('__MATRIX_ITEMS__', items),
    body: BUILD_BODY_TEMPLATE,
  })}\n`;
}
