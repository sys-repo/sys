import { Arr, Err, Fs, Is, Num, Obj, Str, Time } from '../common.ts';

const REPO_ROOT = Fs.resolve(Fs.dirname(Fs.Path.fromFileUrl(import.meta.url)), '../..');
const SYS_ROOT = Fs.join(REPO_ROOT, 'code/sys');
const DECLARATION =
  /^export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)(?:\s*:[^=\n]+)?\s*=\s*(Object\.freeze\s*\()?\s*\{/gm;

const EXCLUSIONS = Object.freeze(
  {
    'code/sys/cell/src/m.cell/common.ts#DEFAULTS': 'configuration data',
    'code/sys/cell/src/m.cell/u/paths.ts#CellPaths': 'metadata path data',
    'code/sys/cell/src/m.help/u/u.paths.ts#HelpResource': 'generated help-resource data',
    'code/sys/cell/src/m.tmpl/u/u.roots.ts#ROOTS': 'template-root data',
    'code/sys/cli/src/m.core/m.Fmt.Code/common.ts#D': 'formatter defaults',
    'code/sys/color/src/m.Rgb/m.Color/u.COLORS.ts#COLORS': 'color constant data',
    'code/sys/fs/src/m.Dir.Hash/-u.ts#Sample': 'test-fixture data',
    'code/sys/fs/src/m.FileMap/common.ts#D': 'file-map defaults',
    'code/sys/fs/src/m.Pkg.Dist/common.ts#D': 'distribution defaults',
    'code/sys/http/src/http.client/m.HttpCache.Cmd/common.ts#D': 'command constants',
    'code/sys/http/src/http.cmd/common.ts#DEFAULTS': 'HTTP command defaults',
    'code/sys/http/src/http.server/m.HttpProxy/common.ts#D': 'proxy defaults',
    'code/sys/http/src/http.server/m.HttpPull/u.resource/u.failure.ts#RESOURCE_FAILURE':
      'failure descriptor data',
    'code/sys/http/src/http.server/m.HttpStatic/common.ts#D': 'static-server defaults',
    'code/sys/schema/src/m.core.schema/common.ts#D': 'schema metadata defaults',
    'code/sys/server/src/m.help/u/u.paths.ts#HelpResource': 'generated help-resource data',
    'code/sys/server/src/m.server.files.service/common.ts#DEFAULTS': 'service defaults',
    'code/sys/server/src/m.server.files/common.ts#DEFAULTS': 'file-server defaults',
    'code/sys/server/src/m.server.websocket/common.ts#DEFAULTS': 'websocket defaults',
    'code/sys/std/src/m.Log/common.ts#D': 'logger defaults',
    'code/sys/std/src/m.Pkg/common.ts#DEFAULTS': 'package defaults and factory data',
    'code/sys/std/src/m.Timecode/m.Pattern.ts#RE': 'stateful RegExp instances',
    'code/sys/std/src/m.Xml/common.ts#DEFAULTS': 'XML parser defaults',
    'code/sys/testing/src/m.client/m.Spec/TestSuite/common.ts#DEFAULT': 'test-suite defaults',
    'code/sys/workspace/src/m.graph/m.snapshot/common.ts#DEFAULTS': 'snapshot metadata defaults',
    'code/sys/workspace/src/m.help/u/u.paths.ts#HelpResource': 'generated help-resource data',
    'code/sys/workspace/src/m.info/u.defaults.ts#DEFAULTS': 'workspace-info defaults',
    'code/sys/yaml/src/m.cli/m.YamlConfig/common.ts#DEFAULT': 'YAML CLI defaults',
    'code/sys/yaml/src/m.core/common.ts#ERR': 'YAML error-name data',
  } satisfies Record<string, string>,
);

type Candidate = {
  readonly key: string;
  readonly name: string;
  readonly path: string;
  readonly frozen: boolean;
};

Deno.test('exported singleton namespace freeze closure', async () => {
  const startedAt = Date.now();
  const candidates = await inventory();
  const failures: string[] = [];
  const keys = candidates.map((candidate) => candidate.key);
  const uniqueKeys = Arr.uniq(keys);
  const expectedExclusions = new Set(Obj.keys(EXCLUSIONS));
  const observedExclusions = new Set<string>();
  let participantCount = 0;
  let exclusionCount = 0;

  if (uniqueKeys.length !== keys.length) {
    failures.push('candidate inventory contains duplicate path/export keys');
  }

  for (const candidate of candidates) {
    if (candidate.frozen) {
      participantCount += 1;
      await assertFrozen(candidate, failures);
      continue;
    }

    const reason = exclusionReason(candidate);
    if (!Is.str(reason)) {
      failures.push(`unclassified raw singleton candidate: ${candidate.key}`);
      continue;
    }

    exclusionCount += 1;
    if (candidate.key in EXCLUSIONS) observedExclusions.add(candidate.key);
  }

  for (const key of expectedExclusions) {
    if (!observedExclusions.has(key)) failures.push(`stale singleton exclusion: ${key}`);
  }

  const classifiedCount = Num.sum([participantCount, exclusionCount]);
  if (classifiedCount !== candidates.length) {
    failures.push(
      `classification mismatch: ${classifiedCount} classified / ${candidates.length} candidates`,
    );
  }

  if (failures.length > 0) {
    const report = Str.builder();
    report.line('Frozen namespace closure failed:');
    report.lines(failures.map((failure) => `- ${failure}`));
    report.line(`Elapsed: ${Time.elapsed(startedAt).msec}ms`);
    throw Err.std(Str.trimEdgeNewlines(String(report)));
  }
});

async function inventory(): Promise<readonly Candidate[]> {
  const paths = (await Fs.ls(SYS_ROOT, { includeDirs: false })).filter(isRuntimeSource);
  const candidates: Candidate[] = [];

  for (const path of paths) {
    const result = await Fs.readText(path);
    if (!result.ok || !Is.str(result.data)) {
      throw Err.std(`Failed to read namespace candidate source: ${path}`, { cause: result.error });
    }

    const source = result.data;
    const relativePath = normalize(Fs.Path.relative(REPO_ROOT, path));
    for (const match of source.matchAll(DECLARATION)) {
      const name = match[1];
      if (!Is.str(name)) continue;
      candidates.push({
        key: `${relativePath}#${name}`,
        name,
        path,
        frozen: Is.str(match[2]),
      });
    }
  }

  return Arr.sortBy(candidates, 'key');
}

async function assertFrozen(candidate: Candidate, failures: string[]) {
  try {
    const module = await import(Fs.Path.toFileUrl(candidate.path).href);
    const exports = Obj.keys(module);
    if (!exports.includes(candidate.name)) {
      failures.push(`declared participant is not exported at runtime: ${candidate.key}`);
      return;
    }

    const value = (module as Record<string, unknown>)[candidate.name];
    if (!Is.object(value)) {
      failures.push(`classified participant is not an object: ${candidate.key}`);
      return;
    }
    if (!Object.isFrozen(value)) failures.push(`mutable namespace participant: ${candidate.key}`);
  } catch (cause) {
    const error = Err.normalize(cause);
    failures.push(`participant import failed: ${candidate.key} (${error.message})`);
  }
}

function exclusionReason(candidate: Candidate): string | undefined {
  if (/^code\/sys\/[^/]+\/src\/pkg\.ts#pkg$/.test(candidate.key)) {
    return 'generated package metadata';
  }
  return EXCLUSIONS[candidate.key as keyof typeof EXCLUSIONS];
}

function isRuntimeSource(path: string): boolean {
  const relative = normalize(Fs.Path.relative(SYS_ROOT, path));
  const parts = relative.split('/');
  const filename = parts.at(-1) ?? '';

  if (parts[1] !== 'src') return false;
  if (!/\.tsx?$/.test(filename)) return false;
  if (parts.some((part) => part.startsWith('-test'))) return false;
  if (filename.endsWith('.test.ts') || filename === '-test.ts') return false;
  if (filename === 'types.ts' || filename === 't.ts' || /^t\..+\.ts$/.test(filename)) return false;
  return true;
}

function normalize(path: string): string {
  return path.replaceAll('\\', '/');
}
