import type { t } from '../common.ts';
import { workflowTemplate, wrangle } from '../u.workflow.ts';
import { loadModule, toModuleYaml } from './u.ts';
import { JSR_MODULES_PLACEHOLDER } from './u.tmpl.ts';

export async function text(args: t.MonorepoCi.Jsr.TextArgs) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  let body = '';

  for (const module of modules) {
    const item = wrangle.indent(toModuleYaml(module), 6);
    body += `${body ? '\n\n' : ''}${item}`;
  }

  return `${workflowTemplate({
    name: 'jsr',
    permissions: {
      contents: 'read',
      'id-token': 'write # The OIDC/ID token is used for authentication with JSR.',
    },
    on: args.on,
    env: args.env,
    body: JSR_MODULES_PLACEHOLDER,
  }).replace(JSR_MODULES_PLACEHOLDER, body)}\n`;
}
