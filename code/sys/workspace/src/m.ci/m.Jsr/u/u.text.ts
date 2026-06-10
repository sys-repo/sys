import { Err, Fs, Str, type t } from '../../common.ts';
import { CI_DENO_VERSION } from '../../u/u.deno.ts';
import { wrangle } from '../../u/u.workflow.ts';
import { filterModules } from './u.filter.ts';
import { deriveStrata, parsePersistedGraph, type ModuleStratum } from './u.graph.ts';
import { toMatrixEntryYaml } from './u.yaml.ts';
import {
  JSR_JOB_CONFIG_TEMPLATE,
  JSR_MATRIX_BODY_TEMPLATE,
  JSR_MAX_PARALLEL,
} from './u.tmpl.ts';

const JSR_MAIN_GUARD_STEP = `
- name: Validate main-only publish commit
  if: github.ref_name == 'jsr-publish-main'
  run: |
    git fetch origin main:refs/remotes/origin/main
    git merge-base --is-ancestor HEAD refs/remotes/origin/main
`;

const PERMISSIONS = {
  contents: 'read',
  'id-token': 'write # The OIDC/ID token is used for authentication with JSR.',
} as const;

export async function text(args: t.WorkspaceCi.Jsr.TextArgs) {
  const cwd = args.cwd ?? Deno.cwd();
  const modules = await filterModules(cwd, args.paths, args.versionFilter);
  const graph = await loadGraph(cwd);
  const strata = deriveStrata(modules, graph);
  const jobs = strata
    .map((stratum, index) => renderPublishJob(stratum, { env: args.env, needs: index > 0 }))
    .join('\n\n');
  const workflow = [
    'name: jsr',
    '',
    wrangle.on(args.on),
    '',
    'concurrency:',
    '  group: jsr-publish',
    '  cancel-in-progress: false',
    '',
    'jobs:',
    wrangle.indent(jobs, 2),
  ].join('\n');

  return `${
    [
      '# Publish trigger workflow.',
      '# The `jsr-publish` tag refreshes a branch-capable publish trigger.',
      '# The `jsr-publish-main` tag refreshes a strict main-only publish trigger.',
      '# Package versions remain the provenance/release identity.',
      workflow,
    ].join('\n')
  }\n`;
}

async function loadGraph(cwd: t.StringDir) {
  const path = Fs.join(cwd, 'deno.graph.json');
  if (!(await Fs.exists(path))) return undefined;

  const res = await Fs.readJson<unknown>(path);
  if (!res.ok) {
    throw Err.std(`Failed to read workspace graph snapshot: ${path}`, { cause: res.error });
  }

  const graph = parsePersistedGraph(res.data);
  if (!graph) throw new Error(`Invalid workspace graph snapshot: ${path}`);
  return graph;
}

function renderPublishJob(
  stratum: ModuleStratum,
  args: { readonly env?: t.WorkspaceCi.WorkflowEntries; readonly needs: boolean },
) {
  const envEntries = args.env ? Object.entries(args.env) : [];
  const env = envEntries.length ? ['  env:', wrangle.map(Object.fromEntries(envEntries), 4)] : [];
  const matrix = stratum.modules
    .map((module) => wrangle.indent(toMatrixEntryYaml(module), 8))
    .join('\n');

  return [
    `publish_${stratum.index}:`,
    `  name: "publish-${stratum.index}: \${{ matrix.name }}"`,
    '  runs-on: ubuntu-latest',
    ...(args.needs ? [`  needs: publish_${stratum.index - 1}`] : []),
    '  permissions:',
    wrangle.map(PERMISSIONS, 4),
    '  environment: dev',
    ...env,
    `  ${JSR_JOB_CONFIG_TEMPLATE.trim()}`,
    '  strategy:',
    '    fail-fast: false',
    `    max-parallel: ${JSR_MAX_PARALLEL}`,
    '    matrix:',
    '      include:',
    matrix,
    '  steps:',
    wrangle.indent(renderSteps(), 4),
  ].join('\n');
}

function renderSteps() {
  return [
    '- uses: actions/checkout@v5',
    Str.dedent(`
      - name: Verify clean checkout
        run: |
          git status --short
          test -z "$(git status --porcelain)"
    `).trim(),
    Str.dedent(`
      - name: 'Install ESM Runtime: Deno 2.x'
        uses: denoland/setup-deno@v2
        with:
          deno-version: ${CI_DENO_VERSION}
    `).trim(),
    Str.dedent(`
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
    `).trim(),
    Str.dedent(`
      - name: Verify clean dependency install
        run: |
          git status --short
          test -z "$(git status --porcelain)"
    `).trim(),
    Str.dedent(`
      - name: Workspace Info
        run: deno task info
    `).trim(),
    Str.dedent(`
      - name: Deno Info
        run: deno info && deno --version
    `).trim(),
    JSR_MAIN_GUARD_STEP.trim(),
    JSR_MATRIX_BODY_TEMPLATE,
  ].join('\n\n');
}
