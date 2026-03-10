import { c, DenoFile, Err, Is, Process, pkg } from './common.ts';

const LINE = '━'.repeat(84);

type JsrMeta = {
  readonly latest?: string;
  readonly versions?: Record<string, { readonly yanked?: boolean }>;
};

export async function main() {
  const ws = await DenoFile.workspace();
  const publishTask = await recommendedPublishTask(ws.dir);
  const published = await hasPublishedVersion(pkg.name, pkg.version);
  if (published.error) {
    printLines(registryErrorLines({ repoRoot: ws.dir, message: published.error.message, publishTask }));
    Deno.exit(1);
  }

  if (!published.data) {
    printLines(releaseGuideLines({
      repoRoot: ws.dir,
      moduleDir: Deno.cwd(),
      pkgName: pkg.name,
      version: pkg.version,
      latest: published.latest,
      publishTask,
    }));
    Deno.exit(1);
  }

  await runTask('prep');
  await runTask('test:external');
}

async function hasPublishedVersion(name: string, version: string) {
  const url = `https://jsr.io/${name}/meta.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const cause = new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
      return { ok: false as const, data: false, latest: '', error: Err.std(cause) };
    }

    const json = (await res.json()) as JsrMeta;
    const versions = json.versions ?? {};
    const current = versions[version];
    return {
      ok: true as const,
      data: Boolean(current && current.yanked !== true),
      latest: Is.string(json.latest) ? json.latest : '',
      error: undefined,
    };
  } catch (error) {
    return { ok: false as const, data: false, latest: '', error: Err.std(Err.normalize(error)) };
  }
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
    c.bold(c.red('SMOKE BLOCKED')),
    c.bold(c.red(LINE)),
    row('What', `${args.pkgName}@${args.version} is not published on JSR`, { valueColor: 'white' }),
    row('Why', 'External smoke validates the published package, not the local checkout', {
      valueColor: 'white',
    }),
    row('JSR', `Latest published version seen: ${latest}`, { valueColor: 'white' }),
    row('Fix', `  cd ${args.repoRoot}`, { valueColor: 'cyan' }),
    row('', `  ${args.publishTask}`, { valueColor: 'cyan' }),
    row('Wait', `GitHub Actions -> jsr -> publish module → "${args.pkgName}"`, { valueColor: 'white' }),
    row('Retry', `  cd ${args.moduleDir}`, { valueColor: 'cyan' }),
    row('', '  deno task smoke', { valueColor: 'cyan' }),
    c.bold(c.red(LINE)),
    '',
  ];
}

export function registryErrorLines(args: { repoRoot: string; message: string; publishTask: string }) {
  return [
    '',
    c.bold(c.yellow('SMOKE PREFLIGHT FAILED')),
    c.bold(c.yellow(LINE)),
    row('What', `Unable to verify JSR metadata for ${pkg.name}@${pkg.version}`, { valueColor: 'white' }),
    row('Error', args.message, { valueColor: 'white' }),
    row('Fix', `  cd ${args.repoRoot}`, { valueColor: 'cyan' }),
    row('', `  ${args.publishTask}`, { valueColor: 'cyan' }),
    row('Try', 'Re-run once. If the version is still missing, publish it from the repo root.', {
      valueColor: 'white',
    }),
    c.bold(c.yellow(LINE)),
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

function row(label: string, value: string, options: { valueColor?: 'white' | 'cyan' } = {}) {
  const head = c.gray(c.bold(label.padEnd(5)));
  const valueText = colorValue(value, options.valueColor ?? 'white');
  return `${head} ${c.gray('│')} ${valueText}`;
}

function colorValue(value: string, color: 'white' | 'cyan') {
  return color === 'cyan' ? c.cyan(value) : c.white(value);
}

function printLines(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}

if (import.meta.main) await main();
