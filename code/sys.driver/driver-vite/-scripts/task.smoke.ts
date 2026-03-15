import { c, DenoFile, Err, Fs, Is, pkg, Process } from './common.ts';

const LINE = '━'.repeat(84);
const RETRY_DELAYS = [0, 500, 1_000, 2_000] as const;

type JsrMeta = {
  readonly latest?: string;
  readonly versions?: Record<string, { readonly yanked?: boolean }>;
};

export async function main() {
  const ws = await DenoFile.workspace();
  const publishTask = await recommendedPublishTask(ws.dir);
  const published = await hasPublishedVersion(pkg.name, pkg.version);
  if (published.error) {
    printLines(
      registryErrorLines({ repoRoot: ws.dir, message: published.error.message, publishTask }),
    );
    Deno.exit(1);
  }

  if (!published.data) {
    printLines(
      releaseGuideLines({
        repoRoot: ws.dir,
        moduleDir: Fs.cwd(),
        pkgName: pkg.name,
        version: pkg.version,
        latest: published.latest,
        publishTask,
      }),
    );
    Deno.exit(1);
  }

  await runTask('prep');
  await runTask('test:external');
}

async function hasPublishedVersion(name: string, version: string) {
  const url = `https://jsr.io/${name}/meta.json`;
  let latest = '';
  let lastError: Error | undefined;

  for (const delay of RETRY_DELAYS) {
    if (delay > 0) await sleep(delay);

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        lastError = new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
        continue;
      }

      const json = (await res.json()) as JsrMeta;
      latest = Is.string(json.latest) ? json.latest : '';
      const versions = json.versions ?? {};
      const current = versions[version];
      if (current && current.yanked !== true) {
        return { ok: true as const, data: true, latest, error: undefined };
      }
    } catch (error) {
      lastError = Err.normalize(error);
    }
  }

  if (lastError) {
    return { ok: false as const, data: false, latest, error: Err.std(lastError) };
  }

  return { ok: true as const, data: false, latest, error: undefined };
}

async function runTask(task: string) {
  const res = await Process.inherit({ cmd: 'deno', args: ['task', task] });
  if (res.success) return;

  throw new Error(`Smoke task failed: deno task ${task}`);
}

export function releaseGuideLines(args: {
  repoRoot: string;
  moduleDir: string;
  pkgName: string;
  version: string;
  latest?: string;
  publishTask: string;
}) {
  const latest = args.latest ? `${args.latest}` : 'unknown';

  return [
    '',
    `${indent()}${c.bold(c.red('SMOKE BLOCKED'))}`,
    `${indent()}${c.bold(c.red(LINE))}`,
    row('What', `${args.pkgName}@${args.version} is not yet visible via JSR package metadata`, {
      color: 'white',
    }),
    row('Why', 'External smoke validates the published package metadata, not the local checkout', {
      color: 'white',
    }),
    row('JSR', `Latest published version seen: ${latest}`, { color: 'white' }),
    row('Fix', '', { color: 'white' }),
    row('', `  cd ${args.repoRoot}`, { color: 'cyan' }),
    row('', `  ${args.publishTask}`, { color: 'cyan' }),
    row('', '', { color: 'white' }),
    row('Wait', `GitHub Actions → jsr → publish module → "${args.pkgName}"`, {
      color: 'white',
    }),
    row('Retry', '', { color: 'white' }),
    row('', `  cd ${args.moduleDir}`, { color: 'cyan' }),
    row('', '  deno task smoke', { color: 'cyan' }),
    row('', '', { color: 'white' }),
    `${indent()}${c.bold(c.red(LINE))}`,
    '',
  ];
}

export function registryErrorLines(args: {
  repoRoot: string;
  message: string;
  publishTask: string;
}) {
  return [
    '',
    `${indent()}${c.bold(c.yellow('SMOKE PREFLIGHT FAILED'))}`,
    `${indent()}${c.bold(c.yellow(LINE))}`,
    row('What', `Unable to verify JSR metadata for ${pkg.name}@${pkg.version}`, {
      color: 'white',
    }),
    row('Error', args.message, { color: 'white' }),
    row('Fix', '', { color: 'white' }),
    row('', `  cd ${args.repoRoot}`, { color: 'cyan' }),
    row('', `  ${args.publishTask}`, { color: 'cyan' }),
    row('', '', { color: 'white' }),
    row('Try', 'Re-run once. If the version is still missing, publish it from the repo root.', {
      color: 'white',
    }),
    `${indent()}${c.bold(c.yellow(LINE))}`,
    '',
  ];
}

async function recommendedPublishTask(repoRoot: string) {
  const branch = await currentBranch(repoRoot);
  return branch === 'main' ? 'deno task publish:jsr' : 'deno task publish:jsr:branch';
}

async function currentBranch(repoRoot: string) {
  const res = await Process.invoke({
    cmd: 'git',
    args: ['branch', '--show-current'],
    cwd: repoRoot,
    silent: true,
  });
  if (!res.success) return '';
  return res.text.stdout.trim();
}

function row(label: string, value: string, options: { color?: 'white' | 'cyan' } = {}) {
  const head = c.gray(label.padEnd(5));
  const valueText = colorValue(value, options.color ?? 'white');
  return `${indent()}${head} ${c.gray('│')} ${valueText}`;
}

function colorValue(value: string, color: 'white' | 'cyan') {
  return color === 'cyan' ? c.cyan(value) : c.white(value);
}

function indent() {
  return ' ';
}

function sleep(msec: number) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

function printLines(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}

if (import.meta.main) await main();
