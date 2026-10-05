import {
  Args,
  c,
  Cli,
  Err,
  Fs,
  Git,
  Is,
  Json,
  JsrUrl,
  Obj,
  Path,
  Process,
  Semver,
  Str,
  Time,
} from './common.ts';

type ParsedArgs = {
  readonly help?: boolean;
  readonly publish?: boolean;
  readonly version?: string;
  readonly from?: string;
  readonly package?: string;
};

export type RunInput = {
  readonly argv?: readonly string[];
  readonly fixtureRoot?: string;
  readonly statePath?: string;
};

export type ProbeArgs = {
  readonly packageName: string;
  readonly version: string;
  readonly publish: boolean;
  readonly fixtureRoot: string;
  readonly statePath: string;
};

export type ProbeState = {
  readonly packageName: string;
  readonly version: string;
};

type ProbeStatus = 'OK' | 'DIVERGENCE' | 'INCONCLUSIVE';

type PackageMeta = {
  readonly versions?: Record<string, unknown>;
};

type FetchMetaResult = {
  readonly status: number;
  readonly etag?: string;
  readonly cacheStatus?: string;
  readonly age?: string;
  readonly contentLength?: string;
  readonly hasVersion: boolean;
};

type DenoInfoResult = Awaited<ReturnType<typeof freshDenoInfo>>;

export type ProbeResult = {
  readonly status: ProbeStatus;
  readonly exact: FetchMetaResult;
  readonly normal: FetchMetaResult;
  readonly busted: FetchMetaResult;
  readonly deno: DenoInfoResult;
};

const DEFAULT_PACKAGE = '@sys/tmp';
const DEFAULT_STATE_PATH = './-scripts/task.probe.jsr.state.json';

export async function createFixtureRoot(input: RunInput) {
  return input.fixtureRoot ?? (await Fs.makeTempDir({ prefix: 'sys-jsr-probe-src-' })).absolute;
}

export function statePath(input: Pick<RunInput, 'statePath'> = {}) {
  return Fs.resolve(input.statePath ?? DEFAULT_STATE_PATH);
}

export async function readProbeState(path = statePath()): Promise<ProbeState> {
  const res = await Fs.readJson<Partial<ProbeState>>(path);
  if (!res.ok) throw new Error(`Failed to read JSR probe state: ${path}`);

  const data = res.data ?? {};

  return {
    packageName: parsePackageName(data.packageName ?? DEFAULT_PACKAGE),
    version: Semver.toString(parseVersion(data.version ?? '', 'state version')),
  };
}

export async function writeProbeState(
  args: Pick<ProbeArgs, 'packageName' | 'version' | 'statePath'>,
) {
  const next = await nextState(args);
  await Fs.writeJson(args.statePath, next);
  return next;
}

export async function readCommittedProbeState(path = statePath()): Promise<ProbeState | undefined> {
  const absolute = Fs.resolve(path);
  const root = await Git.root({ cwd: Path.dirname(absolute) });
  if (!root.ok) return undefined;

  const relative = Path.relative(root.root, absolute);
  const res = await Git.fileAtRef({ cwd: root.root, ref: 'HEAD', path: relative });
  if (!res.ok) return undefined;

  const data = Json.parse<Partial<ProbeState>>(res.text, {});
  return {
    packageName: parsePackageName(data.packageName ?? DEFAULT_PACKAGE),
    version: Semver.toString(parseVersion(data.version ?? '', 'state version')),
  };
}

export function isHelp(argv: readonly string[]) {
  const input = stripTaskSeparator(argv);
  return input.includes('--help') || input.includes('-h');
}

export function parseArgs(
  argv: readonly string[],
  fixtureRoot: string,
  state: ProbeState,
  statePath = DEFAULT_STATE_PATH,
): ProbeArgs | 'help' {
  const unknown: string[] = [];
  const parsed = Args.parse<ParsedArgs>([...stripTaskSeparator(argv)], {
    boolean: ['help', 'publish'],
    string: ['version', 'from', 'package'],
    alias: { h: 'help' },
    unknown: (arg) => {
      unknown.push(arg);
      return false;
    },
  });

  if (parsed.help) return 'help';
  if (unknown.length > 0) throw new Error(`Unknown option: ${unknown.join(', ')}`);
  if (parsed._.length > 0) throw new Error(`Unexpected argument: ${parsed._.join(', ')}`);

  return {
    packageName: parsePackageName(parsed.package ?? state.packageName),
    version: resolveVersion(parsed, state),
    publish: parsed.publish === true,
    fixtureRoot,
    statePath,
  };
}

export function fixtureDir(args: Pick<ProbeArgs, 'fixtureRoot' | 'packageName' | 'version'>) {
  const slug = args.packageName.replace(/^@/, '').replaceAll('/', '-');
  return Fs.resolve(args.fixtureRoot, `${slug}-${args.version}`);
}

export async function generateFixture(args: ProbeArgs) {
  const dir = fixtureDir(args);
  await Fs.remove(dir, { recursive: true });
  await Fs.ensureDir(Fs.join(dir, 'src'));

  await Fs.writeJson(Fs.join(dir, 'deno.json'), {
    name: args.packageName,
    version: args.version,
    license: 'MIT',
    description: 'Maintainer-only JSR/Deno resolver test probe.',
    exports: { '.': './src/mod.ts' },
    publish: {
      include: ['README.md', 'src/**/*.ts', 'deno.json'],
    },
  });

  await Fs.write(
    Fs.join(dir, 'README.md'),
    text(`
      # ${args.packageName}

      Maintainer-only test probe for JSR package metadata and Deno resolver propagation.

      This package is intentionally tiny and is not part of the \`@sys\` workspace graph.

      ## Security posture

      \`@sys/tmp\` is a maintainer-published diagnostic probe, not a provenance-backed \`@sys\`
      library release. It is not part of the workspace graph; do not use it as an application or
      library dependency.

      ## Run

      From the \`@sys\` repo:

      \`\`\`sh
      deno task probe:jsr
      deno task probe:jsr:publish
      deno task probe:jsr -- --version <exact-version>
      \`\`\`

      Omit \`--publish\` for a local JSR publish dry-run. Without a version flag, the task uses
      the next patch version from checked-in probe state. Only \`@sys\` maintainers can publish
      new probe versions.
    `),
  );

  await Fs.write(
    Fs.join(dir, 'src/mod.ts'),
    text(`
      /**
       * @module
       * Maintainer-only test probe for JSR package metadata and Deno resolver propagation.
       */

      /** Probe package name. */
      export const name = '${args.packageName}';

      /** Probe package version. */
      export const version = '${args.version}';

      /** Stable package@version marker for resolver checks. */
      export const marker = '${args.packageName}@${args.version}';
    `),
  );

  return dir;
}

export async function probePublished(args: ProbeArgs): Promise<ProbeResult> {
  const urls = packageUrls(args);
  const exact = await fetchMeta(urls.exact, args.version);
  const normal = await fetchMeta(urls.normal, args.version);
  const busted = await fetchMeta(urls.busted, args.version);
  const deno = await freshDenoInfo(args);

  const status: ProbeStatus = deno.success
    ? 'OK'
    : exact.status === 200 && busted.hasVersion && !normal.hasVersion
    ? 'DIVERGENCE'
    : 'INCONCLUSIVE';

  return { status, exact, normal, busted, deno };
}

export async function runDeno(args: readonly string[], cwd: string) {
  console.info(c.gray(`deno ${args.join(' ')}`));
  const res = await Process.inherit({ cmd: 'deno', args: [...args], cwd });
  if (!res.success) throw new Error(`Command failed: deno ${args.join(' ')}`);
}

export function printPlan(args: ProbeArgs) {
  const table = Cli.table();
  table.push([c.gray('package'), args.packageName]);
  table.push([c.gray('version'), args.version]);
  table.push([c.gray('fixture'), fixtureDir(args)]);
  table.push([c.gray('publish'), fmtPublishMode(args.publish)]);

  console.info();
  console.info(c.bold(c.white('JSR probe')));
  printTable(table);
  console.info();
}

export function printDryRunComplete() {
  console.info();
  console.info(c.green('Dry-run complete.'));
  console.info(
    c.gray('Pass --publish to publish this immutable JSR version and run remote probes.'),
  );
}

export function printProbeResult(result: ProbeResult) {
  console.info();
  console.info(c.bold(`Probe status: ${statusColor(result.status)}`));
  printProbeTable(result);
  if (!result.deno.success) {
    console.info(c.gray(result.deno.text.stderr || result.deno.text.stdout));
  }
}

export function printStateCommitSuggestion(
  from: ProbeState,
  to: Pick<ProbeArgs, 'packageName' | 'version'>,
  status: ProbeResult['status'],
) {
  const message =
    `chore(jsr): advance ${to.packageName} probe state ${from.version} → ${to.version}`;
  const color = status === 'OK' ? 'green' : 'yellow';

  console.info();
  console.info(Cli.Fmt.hr(color));
  console.info(Cli.Fmt.Commit.suggestion(message, { title: false }));
  console.info();
}

export function printHelp() {
  Cli.Fmt.Help.render({
    tool: 'JSR package metadata probe',
    summary: 'Generate a maintainer-only JSR probe fixture and optionally publish it.',
    note: 'Default mode uses the next patch version from checked-in state and runs dry-run only.',
    usage: [
      'deno task probe:jsr',
      'deno task probe:jsr:publish',
      'deno task probe:jsr -- --version <semver> [--publish]',
      'deno task probe:jsr -- --from <current-semver> [--publish]',
    ],
    options: [
      ['--version <semver>', `Exact version for generated ${DEFAULT_PACKAGE} fixture.`],
      ['--from <semver>', 'Use the next patch version after a known current version.'],
      ['--publish', 'Irreversibly publish to JSR, then run remote probes.'],
      ['--package <name>', `Override package name. Defaults to ${DEFAULT_PACKAGE}.`],
    ],
  });
}

export function printError(err: unknown) {
  console.error(c.red(Err.summary(err)));
}

function packageUrls(args: ProbeArgs) {
  const bust = `sys-probe=${Time.now.timestamp}`;
  return {
    exact: JsrUrl.Pkg.version(args.packageName, args.version),
    normal: JsrUrl.Pkg.metadata(args.packageName),
    busted: `${JsrUrl.Pkg.metadata(args.packageName)}?${bust}`,
  } as const;
}

async function fetchMeta(url: string, version: string): Promise<FetchMetaResult> {
  const res = await fetch(url, { cache: 'reload' });
  const data = Json.parse<PackageMeta>(await res.text(), {});
  const versions = data.versions ?? {};

  return {
    status: res.status,
    etag: res.headers.get('etag') ?? undefined,
    cacheStatus: res.headers.get('cf-cache-status') ?? undefined,
    age: res.headers.get('age') ?? undefined,
    contentLength: res.headers.get('content-length') ?? undefined,
    hasVersion: Obj.hasOwn(versions, version),
  };
}

async function freshDenoInfo(args: ProbeArgs) {
  const denoDir = await Fs.makeTempDir({ prefix: 'sys-jsr-probe-' });
  const specifier = `jsr:${args.packageName}@${args.version}`;

  try {
    return await Process.invoke({
      cmd: 'deno',
      args: ['info', '--no-config', '--no-lock', '--reload', specifier],
      cwd: denoDir.absolute,
      env: { DENO_DIR: denoDir.absolute },
      silent: true,
    });
  } finally {
    await Fs.remove(denoDir.absolute, { recursive: true });
  }
}

function stripTaskSeparator(argv: readonly string[]) {
  return argv[0] === '--' ? argv.slice(1) : argv;
}

function resolveVersion(parsed: ParsedArgs, state: ProbeState) {
  const hasVersion = Is.string(parsed.version) && parsed.version.trim().length > 0;
  const hasFrom = Is.string(parsed.from) && parsed.from.trim().length > 0;

  if (hasVersion && hasFrom) throw new Error('--version and --from are mutually exclusive.');
  if (hasFrom) return nextPatchVersion(parsed.from);
  if (hasVersion) return Semver.toString(parseVersion(parsed.version, '--version'));

  return nextPatchVersion(state.version);
}

async function nextState(args: Pick<ProbeArgs, 'packageName' | 'version' | 'statePath'>) {
  const current = await readProbeState(args.statePath);
  if (current.packageName !== args.packageName) {
    return { packageName: args.packageName, version: args.version };
  }

  const version = Semver.Is.greaterThan(args.version, current.version)
    ? args.version
    : current.version;
  return { packageName: args.packageName, version };
}

function nextPatchVersion(input: string) {
  const current = parseVersion(input, '--from');
  return Semver.toString(Semver.increment(current, 'patch'));
}

function parseVersion(input: string, flag: '--version' | '--from' | 'state version') {
  const text = input.trim();
  const res = Semver.parse(text);
  if (res.error) throw new Error(`Invalid ${flag}: ${text}`);
  return res.version;
}

function parsePackageName(input: unknown) {
  if (!JsrUrl.Pkg.Is.name(input)) throw new Error(`Invalid --package: ${input}`);
  return input;
}

function text(input: string) {
  return `${Str.dedent(input)}\n`;
}

function printProbeTable(result: ProbeResult) {
  const metadataRows: readonly (readonly [string, FetchMetaResult])[] = [
    ['exact', result.exact],
    ['normal', result.normal],
    ['busted', result.busted],
  ];
  const tableRows = [
    ['source', 'status', 'hasVersion', 'etag', 'length'].map(c.gray),
    ...metadataRows.map(([label, meta]) => [
      c.gray(label),
      String(meta.status),
      fmtBool(meta.hasVersion),
      fmtEtag(meta.etag),
      meta.contentLength ?? '',
    ]),
    [c.gray('deno'), result.deno.success ? c.green('resolved') : c.red('failed')],
  ];
  const table = Cli.table();
  for (const row of tableRows) table.push(row);
  printTable(table);
}

function printTable(table: unknown) {
  const lines = String(table).split('\n').map((line) => line.trimEnd());
  while (lines[0]?.trim() === '') lines.shift();
  while (lines.at(-1)?.trim() === '') lines.pop();
  console.info(lines.join('\n'));
}

function fmtBool(value: boolean) {
  return value ? c.green('yes') : c.yellow('no');
}

function fmtEtag(value?: string) {
  return value?.replace(/^"(.*)"$/, '$1') ?? '';
}

function fmtPublishMode(value: boolean) {
  return value ? fmtBool(true) : `${fmtBool(false)} ${c.gray('(dry run)')}`;
}

function statusColor(status: ProbeStatus) {
  if (status === 'OK') return c.green(status);
  if (status === 'DIVERGENCE') return c.red(status);
  return c.yellow(status);
}
