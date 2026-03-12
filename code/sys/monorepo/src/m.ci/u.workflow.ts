import { type t, Str } from './common.ts';
import { CI_DENO_VERSION } from './u.deno.ts';

type WorkflowArgs = {
  readonly name: string;
  readonly permissions: t.MonorepoCi.WorkflowEntries;
  readonly on?: t.MonorepoCi.WorkflowOn;
  readonly env?: t.MonorepoCi.WorkflowEntries;
  readonly jobConfig?: string;
  readonly body: string;
};

export function workflowTemplate(args: WorkflowArgs) {
  const permissions = wrangle.map(args.permissions, 6);
  const on = wrangle.on(args.on);
  const envEntries = args.env ? Object.entries(args.env) : [];
  const env = envEntries.length
    ? `    env:\n${wrangle.map(Object.fromEntries(envEntries), 6)}\n`
    : '';
  const jobConfig = args.jobConfig ? `${args.jobConfig}\n` : '';
  const steps = Str.dedent(
    `
    steps:
      - uses: actions/checkout@v5

      - name: 'Install ESM Runtime: Deno 2.x'
        uses: denoland/setup-deno@v2
        with:
          deno-version: ${CI_DENO_VERSION}

      - name: Install Dependencies
        run: deno task install

      - name: Monorepo Info
        run: deno task info

      - name: Deno Info
        run: deno info && deno --version
  `,
  ).trim();

  return Str.dedent(
    `
    name: ${args.name}

    __ON__

    jobs:
      deno:
        runs-on: ubuntu-latest
        permissions:
        __PERMISSIONS__
        environment: dev
        __ENV__
        __JOB_CONFIG__
        __STEPS__

        __BODY__
  `,
  )
    .replace(/^\s*__ON__$/m, on)
    .replace(/^\s*__PERMISSIONS__$/m, permissions)
    .replace(/^\s*__ENV__$/m, env.trimEnd())
    .replace(/^\s*__JOB_CONFIG__$/m, jobConfig.trimEnd())
    .replace(/^\s*__STEPS__$/m, wrangle.indent(steps, 4))
    .replace(/^\s*__BODY__$/m, args.body);
}

export const wrangle = {
  indent(text: string, indent: number) {
    return text
      .split('\n')
      .map((line) => `${' '.repeat(indent)}${line}`)
      .filter((line) => (!line.trim() ? line.trim() : line))
      .join('\n');
  },

  map(entries: Readonly<Record<string, string>>, indent: number) {
    return Object.entries(entries)
      .map(([key, value]) => `${' '.repeat(indent)}${key}: ${value}`)
      .join('\n');
  },

  list(values: readonly string[], indent: number) {
    return values.map((value) => `${' '.repeat(indent)}- ${value}`).join('\n');
  },

  on(value?: t.MonorepoCi.WorkflowOn) {
    const on = value ?? { push: { branches: ['main'] as const } };
    const lines = ['on:'];
    if (on.push?.branches?.length || on.push?.tags?.length) {
      lines.push('  push:');
      if (on.push?.branches?.length) lines.push('    branches:', wrangle.list(on.push.branches, 6));
      if (on.push?.tags?.length) lines.push('    tags:', wrangle.list(on.push.tags, 6));
      if (on.push?.paths_ignore?.length) {
        lines.push('    paths-ignore:', wrangle.list(on.push.paths_ignore, 6));
      }
    }
    if (on.pull_request?.branches?.length) {
      lines.push('  pull_request:', '    branches:', wrangle.list(on.pull_request.branches, 6));
      if (on.pull_request?.paths_ignore?.length) {
        lines.push('    paths-ignore:', wrangle.list(on.pull_request.paths_ignore, 6));
      }
    }
    if (on.workflow_dispatch) lines.push('  workflow_dispatch:');
    return lines.join('\n');
  },
} as const;
