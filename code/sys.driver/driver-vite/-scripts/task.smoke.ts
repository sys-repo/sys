import { c, DenoFile, Err, Is, Process, pkg } from './common.ts';

const ROOT_TASK = 'deno task publish:jsr:main';
const LINE = '━'.repeat(84);

type JsrMeta = {
  readonly latest?: string;
  readonly versions?: Record<string, { readonly yanked?: boolean }>;
};

export async function main() {
  const ws = await DenoFile.workspace();
  const published = await hasPublishedVersion(pkg.name, pkg.version);
  if (published.error) {
    printLines(registryErrorLines({ repoRoot: ws.dir, message: published.error.message }));
    Deno.exit(1);
  }

  if (!published.data) {
    printLines(releaseGuideLines({
      repoRoot: ws.dir,
      moduleDir: Deno.cwd(),
      pkgName: pkg.name,
      version: pkg.version,
      latest: published.latest,
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
}) {
  const latest = args.latest ? `${args.latest}` : 'unknown';

  return [
    '',
    c.bold(c.red('SMOKE BLOCKED')),
    c.bold(c.red(LINE)),
    row('WHAT', `${args.pkgName}@${args.version} is not published on JSR`),
    row('WHY', 'External smoke validates the published package, not the local checkout'),
    row('JSR', `Latest published version seen: ${latest}`),
    row('FIX', `cd ${args.repoRoot}`),
    row('RUN', ROOT_TASK),
    row('WAIT', `GitHub Actions -> jsr -> publish module → "${args.pkgName}"`),
    row('RETRY', `cd ${args.moduleDir} && deno task smoke`),
    c.bold(c.red(LINE)),
    '',
  ];
}

export function registryErrorLines(args: { repoRoot: string; message: string }) {
  return [
    '',
    c.bold(c.yellow('SMOKE PREFLIGHT FAILED')),
    c.bold(c.yellow(LINE)),
    row('WHAT', `Unable to verify JSR metadata for ${pkg.name}@${pkg.version}`),
    row('ERROR', args.message),
    row('FIX', `cd ${args.repoRoot}`),
    row('RUN', ROOT_TASK),
    row('TRY', 'Re-run once. If the version is still missing, publish it from the repo root.'),
    c.bold(c.yellow(LINE)),
    '',
  ];
}

function row(label: string, value: string) {
  const head = c.bold(label.padEnd(5));
  return `${head} ${c.gray('│')} ${value}`;
}

function printLines(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}

if (import.meta.main) await main();
