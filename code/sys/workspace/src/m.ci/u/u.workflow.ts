import { Str, type t } from '../common.ts';
import { CI_DENO_VERSION } from '../u.deno.ts';
import { wrangle } from './u.yaml.ts';

export { wrangle } from './u.yaml.ts';

type WorkflowArgs = {
  readonly name: string;
  readonly permissions: t.WorkspaceCi.WorkflowEntries;
  readonly on?: t.WorkspaceCi.WorkflowOn;
  readonly env?: t.WorkspaceCi.WorkflowEntries;
  readonly beforeDenoJob?: string;
  readonly jobConfig?: string;
  readonly verifyCleanCheckout?: boolean;
  readonly body: string;
};

export function workflowTemplate(args: WorkflowArgs) {
  const permissions = wrangle.map(args.permissions, 6);
  const on = wrangle.on(args.on);
  const envEntries = args.env ? Object.entries(args.env) : [];
  const env = envEntries.length
    ? `    env:\n${wrangle.map(Object.fromEntries(envEntries), 6)}\n`
    : '';
  const beforeDenoJob = args.beforeDenoJob
    ? `${wrangle.indent(args.beforeDenoJob.trim(), 2)}\n`
    : '';
  const jobConfig = args.jobConfig ? `${args.jobConfig}\n` : '';
  const verifyCheckout = args.verifyCleanCheckout
    ? Str.dedent(`
        - name: Verify clean checkout
          run: |
            git status --short
            test -z "$(git status --porcelain)"
      `).trim()
    : '';
  const checkout = verifyCheckout
    ? `- uses: actions/checkout@v5\n\n${verifyCheckout}`
    : '- uses: actions/checkout@v5';
  const verifyCleanInstall = args.verifyCleanCheckout
    ? wrangle.indent(
      Str.dedent(`
        - name: Verify clean dependency install
          run: |
            git status --short
            test -z "$(git status --porcelain)"
      `).trim(),
      6,
    )
    : '';
  const steps = Str.dedent(
    `
    steps:
      ${checkout.replace(/\n/g, '\n      ')}

      - name: 'Install ESM Runtime: Deno 2.x'
        uses: denoland/setup-deno@v2
        with:
          deno-version: ${CI_DENO_VERSION}

      - name: Install Dependencies
        run: |
          max_attempts=3
          for attempt in $(seq 1 $max_attempts); do
              if deno task install; then
                exit 0
              fi
              if [ "$attempt" -lt "$max_attempts" ]; then
                delay=$((5 * 2 ** (attempt - 1)))
                echo "dependency install failed (attempt $attempt/$max_attempts), retrying in \${delay}s..."
                sleep "$delay"
              fi
          done
          echo "dependency install failed after $max_attempts attempts"
          exit 1

      __VERIFY_CLEAN_INSTALL__

      - name: Workspace Info
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
      __BEFORE_DENO_JOB__
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
    .replace(/^\s*__BEFORE_DENO_JOB__\n/m, beforeDenoJob)
    .replace(/^\s*__PERMISSIONS__$/m, permissions)
    .replace(/^\s*__ENV__$/m, env.trimEnd())
    .replace(/^\s*__JOB_CONFIG__$/m, jobConfig.trimEnd())
    .replace(
      /^\s*__STEPS__$/m,
      wrangle.indent(steps, 4).replace(
        /\n\s*__VERIFY_CLEAN_INSTALL__\n/m,
        verifyCleanInstall ? `\n${verifyCleanInstall}\n` : '\n',
      ),
    )
    .replace(/^\s*__BODY__$/m, args.body);
}
