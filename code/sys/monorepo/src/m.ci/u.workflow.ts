import { type t, Str } from './common.ts';

type WorkflowArgs = {
  readonly name: string;
  readonly permissions: string;
  readonly jobConfig?: string;
  readonly body: string;
};

export function workflowTemplate(args: WorkflowArgs) {
  const jobConfig = args.jobConfig ? `\n${args.jobConfig}` : '';
  return Str.dedent(`
    name: ${args.name}

    on:
      push:
        branches:
          - main
          - phil-work

    jobs:
      deno:
        runs-on: ubuntu-latest
        permissions:
    ${args.permissions}
        environment: dev
        env:
          TEST_SAMPLE: \${{ vars.TEST_SAMPLE }}
          DENO_SUBHOSTING_ACCESS_TOKEN: \${{ secrets.DENO_SUBHOSTING_ACCESS_TOKEN }}
          DENO_SUBHOSTING_DEPLOY_ORG_ID: \${{ vars.DENO_SUBHOSTING_DEPLOY_ORG_ID }}
          PRIVY_APP_ID: \${{ vars.PRIVY_APP_ID }}
          PRIVY_APP_SECRET: \${{ vars.PRIVY_APP_SECRET }}${jobConfig}

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

    ${args.body}
  `);
}

export const wrangle = {
  indent(text: string, indent: number) {
    return text
      .split('\n')
      .map((line) => `${' '.repeat(indent)}${line}`)
      .filter((line) => (!line.trim() ? line.trim() : line))
      .join('\n');
  },
} as const;
