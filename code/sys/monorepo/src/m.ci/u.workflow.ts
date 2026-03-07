import { type t, Str } from './common.ts';

type WorkflowArgs = {
  readonly name: string;
  readonly permissions: t.MonorepoCi.WorkflowEntries;
  readonly branches?: readonly string[];
  readonly env?: t.MonorepoCi.WorkflowEntries;
  readonly jobConfig?: string;
  readonly body: string;
};

export function workflowTemplate(args: WorkflowArgs) {
  const permissions = wrangle.map(args.permissions, 6);
  const branches = wrangle.list(args.branches?.length ? args.branches : ['main'], 6);
  const envEntries = args.env ? Object.entries(args.env) : [];
  const env = envEntries.length ? `    env:\n${wrangle.map(Object.fromEntries(envEntries), 6)}\n` : '';
  const jobConfig = args.jobConfig ? `${args.jobConfig}\n` : '';
  const steps = Str.dedent(`
    steps:
      - uses: actions/checkout@v3

      - name: 'Install ESM Runtime: Deno 2.x'
        uses: denoland/setup-deno@v1
        with:
          deno-version: v2.5.x

      - name: 'Install ES Modules from JSR: https://jsr.io/@sys'
        run: deno task help

      - name: Deno Info
        run: deno info && deno --version

      - name: System Info
        run: deno task help
  `).trim();

  return Str.dedent(`
    name: ${args.name}

    on:
      push:
        branches:
        __BRANCHES__

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
  `)
    .replace(/^ {4}__BRANCHES__$/m, branches)
    .replace(/^ {4}__PERMISSIONS__$/m, permissions)
    .replace(/^ {4}__ENV__$/m, env.trimEnd())
    .replace(/^ {4}__JOB_CONFIG__$/m, jobConfig.trimEnd())
    .replace(/^ {4}__STEPS__$/m, wrangle.indent(steps, 4))
    .replace(/^ {4}__BODY__$/m, args.body);
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
} as const;
