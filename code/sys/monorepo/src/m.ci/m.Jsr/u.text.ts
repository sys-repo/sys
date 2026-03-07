import type { t } from '../common.ts';
import { workflowTemplate, wrangle } from '../u.workflow.ts';
import { loadModule, toModuleYaml } from './u.ts';
import { JSR_MODULES_PLACEHOLDER } from './u.tmpl.ts';

const JSR_MAIN_GUARD_STEP = `
- name: Validate main-only publish commit
  if: github.ref_name == 'jsr-publish-main'
  run: |
    git fetch origin main:refs/remotes/origin/main
    git merge-base --is-ancestor HEAD refs/remotes/origin/main
`;

export async function text(args: t.MonorepoCi.Jsr.TextArgs) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await Promise.all(args.paths.map((path) => loadModule(cwd, path)));
  let body = wrangle.indent(JSR_MAIN_GUARD_STEP.trim(), 6);

  for (const module of modules) {
    const item = wrangle.indent(toModuleYaml(module), 6);
    body += `${body ? '\n\n' : ''}${item}`;
  }

  const workflow = workflowTemplate({
    name: 'jsr',
    permissions: {
      contents: 'read',
      'id-token': 'write # The OIDC/ID token is used for authentication with JSR.',
    },
    on: args.on,
    env: args.env,
    body: JSR_MODULES_PLACEHOLDER,
  }).replace(JSR_MODULES_PLACEHOLDER, body);

  return `${[
    '# Publish trigger workflow.',
    '# The `jsr-publish` tag refreshes a branch-capable publish trigger.',
    '# The `jsr-publish-main` tag refreshes a strict main-only publish trigger.',
    '# Package versions remain the provenance/release identity.',
    workflow,
  ].join('\n')}\n`;
}
