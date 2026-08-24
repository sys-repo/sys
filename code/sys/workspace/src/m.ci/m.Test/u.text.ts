import { Fs, type t } from '../common.ts';
import { workflowTemplate, wrangle } from '../u/u.workflow.ts';
import { loadLinuxModule, toMatrixItemYaml } from './u.ts';
import { TEST_BODY_TEMPLATE, TEST_JOB_CONFIG_TEMPLATE } from './u.tmpl.ts';

export async function text(args: t.WorkspaceCi.Test.Linux.Args) {
  const cwd = args.cwd ?? Fs.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadLinuxModule(cwd, path)));
  const items = modules.length
    ? modules.map((module) => wrangle.indent(toMatrixItemYaml(module), 10)).join('\n')
    : '          []';
  return `${
    workflowTemplate({
      name: 'test:linux',
      permissions: { contents: 'read' },
      on: args.on,
      env: args.env,
      jobConfig: TEST_JOB_CONFIG_TEMPLATE.replace('__MATRIX_ITEMS__', items),
      body: TEST_BODY_TEMPLATE,
    })
  }\n`;
}
