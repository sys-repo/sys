import { PI_AGENT_IMPORT_BASE } from '../../src/m.cli/u/u.resolve.pkg.ts';
import { Args, Err, expect, Fs, Hash, Is, Json, type t } from '../common.ts';

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');

/** This test surface accepts a release identity, never an arbitrary executable or import. */
export function selectHost(argv: string[], canonical: string) {
  const args = Args.parse(argv, {
    string: ['pi-version'],
    unknown: (arg) => {
      throw Err.std(`Unknown host-proof argument: ${arg}`);
    },
  });
  const version = args['pi-version'];
  if (args._.length || (version !== undefined && !Is.string(version))) {
    throw Err.std('Use one --pi-version=<exact stable release>.');
  }
  const pkg = version === undefined ? canonical : `${PI_AGENT_IMPORT_BASE}@${version}`;
  const release = pkg.slice(`${PI_AGENT_IMPORT_BASE}@`.length);
  if (
    !pkg.startsWith(`${PI_AGENT_IMPORT_BASE}@`) ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(release)
  ) {
    throw Err.std('The host proof requires one exact official Pi stable release.');
  }
  return { pkg, version: release, explicit: version !== undefined };
}

/** Persistent, explicitly admitted artifacts; every verification copies these into a fresh host. */
export function hostPaths(version: string) {
  const root = Fs.join(PACKAGE_ROOT, '.tmp', 'pi-compat', version);
  return {
    root,
    cache: Fs.join(root, 'deno'),
    config: Fs.join(root, 'deno.json'),
    lock: Fs.join(root, 'deno.lock'),
    receipt: Fs.join(root, 'admitted.json'),
  };
}

export function hostConfig(pkg: string) {
  return { workspace: [], nodeModulesDir: 'none', imports: { 'pi-host': pkg } };
}

/** Cache preparation is not startup proof. Preserve the resolver's own npm integrity evidence. */
export async function hostArtifact(pkg: string, version: string) {
  const paths = hostPaths(version);
  const dir = Fs.join(
    paths.cache,
    'npm/registry.npmjs.org/@earendil-works/pi-coding-agent',
    version,
  );
  const manifest = await Fs.readJson<{ name: string; version: string; bin: { pi: string } }>(
    Fs.join(dir, 'package.json'),
  );
  expect(manifest.data?.name).to.eql('@earendil-works/pi-coding-agent');
  expect(manifest.data?.version).to.eql(version);
  expect(Is.string(manifest.data?.bin?.pi), 'official npm executable metadata').to.eql(true);

  const docs = await Fs.readText(Fs.join(dir, 'docs/environment-variables.md'));
  expect(docs.data, 'candidate must document the offline startup contract').to.contain(
    'PI_OFFLINE',
  );
  const config = await Fs.readJson(paths.config);
  expect(config.data).to.eql(hostConfig(pkg));
  const lock = await Fs.readText(paths.lock);
  if (!lock.ok || !Is.string(lock.data)) throw Err.std(`Missing admitted lock: ${paths.lock}`);
  const graph: unknown = Json.parse(lock.data);
  if (!Is.record(graph) || !Is.record(graph.specifiers) || !Is.record(graph.npm)) {
    throw Err.std('Missing npm lock evidence.');
  }
  expect(graph.specifiers[pkg], 'exact locked release').to.eql(version);
  const entry = graph.npm[`@earendil-works/pi-coding-agent@${version}`];
  if (!Is.record(entry) || !Is.string(entry.integrity)) {
    throw Err.std('Missing official Pi archive integrity.');
  }
  return {
    pkg,
    bin: manifest.data!.bin.pi,
    registry: 'https://registry.npmjs.org/',
    integrity: entry.integrity,
    lock: Hash.sha256(lock.data),
  };
}

export async function requireAdmittedHost(pkg: string, version: string) {
  const paths = hostPaths(version);
  const receipt = await Fs.readJson(paths.receipt);
  if (!receipt.ok || !Is.record(receipt.data)) {
    throw Err.std(
      `Artifacts not admitted. Run: deno task test:compat:admit --pi-version=${version}`,
    );
  }
  const artifact = await hostArtifact(pkg, version);
  expect(receipt.data.artifact, 'admission must match the selected artifacts').to.eql(artifact);
  return { paths, artifact };
}

/** Test-only tightening, before the npm bin. Keep the owner-produced Pi argv intact. */
export function isolateHostArgs(
  args: string[],
  pkg: string,
  root: string,
): string[] {
  const index = args.indexOf(pkg);
  const noLock = args.indexOf('--no-lock');
  if (args[0] !== 'run' || index < 1 || noLock < 1 || noLock >= index) {
    throw Err.std('Unexpected owner-produced npm CLI launch vector.');
  }
  return [
    ...args.slice(0, index).filter((arg) => arg !== '--no-lock'),
    `--config=${Fs.join(root, 'deno.json')}`,
    `--lock=${Fs.join(root, 'deno.lock')}`,
    '--frozen',
    '--cached-only',
    '--deny-import',
    '--deny-net',
    '--deny-run',
    '--deny-ffi',
    ...args.slice(index),
  ];
}

/** Always report the actual bounded child evidence, including non-success, before assertions. */
export function reportHostOutput(output: t.Process.CaptureOutput) {
  console.info(Json.stringify({
    outcome: output.outcome,
    code: output.code,
    signal: output.signal,
    stdoutTruncated: output.stdoutTruncated,
    stderrTruncated: output.stderrTruncated,
    ...(('error' in output) ? { error: output.error } : {}),
  }));
  console.info('--- child stdout ---\n' + output.text.stdout);
  console.info('--- child stderr ---\n' + output.text.stderr);
}

export function expectCompleteExit(output: t.Process.CaptureOutput) {
  expect(output.outcome, 'natural child settlement').to.eql('exited');
  expect(output.stdoutTruncated, 'complete host evidence').to.eql(false);
  expect(output.stderrTruncated, 'complete host diagnostics').to.eql(false);
}

/** Used by the observer assertion, not as a substitute for child-side permission flags. */
export const HOST_DENIED = {
  net: 'denied',
  run: 'denied',
  ffi: 'denied',
  import: 'denied',
} as const;
