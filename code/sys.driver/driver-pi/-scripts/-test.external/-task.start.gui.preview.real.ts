import { describe, DistServer, expect, Fs, FsDist, Hash, Is, it, Process, Str } from '../common.ts';

import {
  admitApplicationPkg,
  snapshotDevelopmentAuthority,
  START_GUI_SERVICE,
} from '../../src/m.cli/m.profiles/u.start/u.gui/u.service.ts';
import type { t } from '../m.start.gui.preview.build/common.ts';
import {
  allocatePreviewGeneration,
  buildPreviewGeneration,
  mainWith,
  PACKAGE_ROOT,
  WORKSPACE_ROOT,
} from '../m.start.gui.preview.build/u.runtime.ts';
import { vitePaths } from '../u.vite.paths.ts';

type DevelopmentSource = t.PreviewDevelopmentSource;
type DirectoryEntry =
  | { readonly path: string; readonly kind: 'directory' }
  | { readonly path: string; readonly kind: 'file'; readonly integrity: t.StringHash };
type DirectorySnapshot =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly entries: readonly DirectoryEntry[] };
type FileSnapshot =
  | { readonly exists: false }
  | { readonly exists: true; readonly integrity: t.StringHash };

const SHARED_DIST: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, 'dist');
const AMBIENT_ENV_SENTINEL = 'SYS_DRIVER_PI_PREVIEW_AMBIENT_SENTINEL';

describe('driver-pi/scripts/task.start.gui.preview real build isolation', () => {
  it('sanitizes the worker environment before loading ambient toolchain code', async () => {
    const env = { [AMBIENT_ENV_SENTINEL]: 'must-not-cross-worker-boundary' };
    const capture = (args: readonly string[]) =>
      Process.capture({
        cmd: Deno.execPath(),
        args: [...args],
        cwd: PACKAGE_ROOT,
        env,
        maxStdoutBytes: 64 * 1024,
        maxStderrBytes: 64 * 1024,
      });

    const unsanitized = await capture([
      'run',
      '--quiet',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '-P=preview-worker',
      '--deny-write=../../..',
      './-scripts/m.start.gui.preview.build/-entry.worker.ts',
      '--environment-preflight',
    ]);
    expect(unsanitized.outcome).to.eql('exited');
    expect(unsanitized.success).to.eql(false);
    expect(unsanitized.text.stderr).to.contain(
      'start:gui:preview worker environment unsanitized.',
    );

    const sanitized = await capture([
      'run',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '-P=preview-launch',
      './-scripts/task.start.gui.preview.ts',
      '--environment-preflight',
    ]);
    expect(sanitized.outcome).to.eql('exited');
    expect(sanitized.success).to.eql(true);
  });

  it('denies outer preview authority over workspace writes, wildcard bind, and unlisted run', async () => {
    const forbiddenWrites = [
      SHARED_DIST,
      Fs.join(WORKSPACE_ROOT, '.pi/@sys/dist'),
      Fs.resolve(PACKAGE_ROOT, '../driver-vite'),
    ];
    for (const path of forbiddenWrites) {
      const status = await Deno.permissions.query({ name: 'write', path });
      expect(status.state).not.to.eql('granted');
    }

    const wildcard = await Deno.permissions.query({ name: 'net', host: '0.0.0.0' });
    const unlistedRun = await Deno.permissions.query({ name: 'run', command: 'sh' });
    expect(wildcard.state).not.to.eql('granted');
    expect(unlistedRun.state).not.to.eql('granted');
  });

  it('snapshot setup refusal → restore absent, empty and present sentinel values', async () => {
    const previous = Deno.env.get(AMBIENT_ENV_SENTINEL);
    const temporary = await Fs.makeTempDir({ prefix: 'driver-pi.preview.setup.' });
    try {
      const unsupported = Fs.join(temporary.absolute, 'not-a-directory');
      await Fs.write(unsupported, 'file', { throw: true });
      const cases = [
        { name: 'absent', value: undefined },
        { name: 'empty', value: '' },
        { name: 'present', value: 'original-sentinel' },
      ];
      for (const { name, value } of cases) {
        if (value === undefined) Deno.env.delete(AMBIENT_ENV_SENTINEL);
        else Deno.env.set(AMBIENT_ENV_SENTINEL, value);
        let refusal: unknown;
        let actual: unknown;
        try {
          await withPreviewSentinel(async () => {
            expect(Deno.env.get(AMBIENT_ENV_SENTINEL)).to.eql('must-not-cross-build-boundary');
            try {
              await directorySnapshot(unsupported);
            } catch (cause) {
              refusal = cause;
              throw cause;
            }
          });
        } catch (cause) {
          actual = cause;
        }
        if (!Is.error(refusal)) throw new Error('Expected real snapshot setup refusal.');
        expect(refusal.message).to.eql(`Unsupported shared Dist root: ${unsupported}`);
        expect(actual).to.equal(refusal);
        expect(Deno.env.get(AMBIENT_ENV_SENTINEL), name).to.eql(value);
      }
    } finally {
      if (previous === undefined) Deno.env.delete(AMBIENT_ENV_SENTINEL);
      else Deno.env.set(AMBIENT_ENV_SENTINEL, previous);
      await Fs.remove(temporary.absolute);
    }
  });

  it(
    'keeps the first real Vite generation verified after a second real build',
    () => withPreviewSentinel(provePreviewIsolation),
  );

  it('distinguishes absent and present trees and rejects unsupported entries', async () => {
    const temporary = await Fs.makeTempDir({ prefix: 'driver-pi.preview.snapshot.' });
    const root: t.StringAbsoluteDir = temporary.absolute;
    const tree: t.StringAbsoluteDir = Fs.join(root, 'tree');
    const nested = Fs.join(tree, 'nested');
    const file = Fs.join(nested, 'value.txt');

    try {
      expect(await directorySnapshot(tree)).to.eql({ kind: 'absent' });

      await Fs.ensureDir(nested);
      await Fs.write(file, 'one');
      const first = await directorySnapshot(tree);
      expect(first.kind).to.eql('present');
      if (first.kind !== 'present') throw new Error('Expected present snapshot.');
      expect(first.entries.map((entry) => [entry.path, entry.kind])).to.eql([
        ['nested', 'directory'],
        ['nested/value.txt', 'file'],
      ]);

      await Fs.write(file, 'two');
      expect(await directorySnapshot(tree)).not.to.eql(first);

      const link = Fs.join(tree, 'link');
      await Deno.symlink(file, link);
      const linked = await snapshotRejection(tree);
      expect(linked.message).to.eql('Unsupported shared Dist entry: link');
      await Fs.remove(link);

      const unsupported: t.StringAbsoluteDir = Fs.join(root, 'not-a-directory');
      await Fs.write(unsupported, 'file');
      const wrongRoot = await snapshotRejection(unsupported);
      expect(wrongRoot.message).to.eql(`Unsupported shared Dist root: ${unsupported}`);
    } finally {
      await Fs.remove(root);
    }
  });
});

async function withPreviewSentinel(body: () => Promise<void>): Promise<void> {
  const previous = Deno.env.get(AMBIENT_ENV_SENTINEL);
  const failures: unknown[] = [];
  try {
    Deno.env.set(AMBIENT_ENV_SENTINEL, 'must-not-cross-build-boundary');
    await body();
  } catch (cause) {
    failures.push(cause);
  }
  try {
    if (previous === undefined) Deno.env.delete(AMBIENT_ENV_SENTINEL);
    else Deno.env.set(AMBIENT_ENV_SENTINEL, previous);
  } catch (cause) {
    failures.push(cause);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Real preview proof and sentinel restoration failed.');
  }
}

async function provePreviewIsolation(): Promise<void> {
  const paths = vitePaths(PACKAGE_ROOT);
  const sharedBefore = await directorySnapshot(SHARED_DIST);
  const firstReady = Promise.withResolvers<void>();
  const releaseFirst = Promise.withResolvers<void>();
  let firstSource: DevelopmentSource | undefined;
  let secondSource: DevelopmentSource | undefined;
  let firstOrigin: t.StringUrl | undefined;
  let firstManifest: FileSnapshot | undefined;
  let secondManifest: FileSnapshot | undefined;
  let firstManifestChecksum: t.StringHash | undefined;
  let secondManifestChecksum: t.StringHash | undefined;
  let secondBody = '';

  const firstRun = mainWith({
    paths,
    allocate: allocatePreviewGeneration,
    async build(input) {
      const result = await buildPreviewGeneration({ ...input, dependencyPolicy: 'frozen-cache' });
      if (result.ok) firstManifestChecksum = result.manifestChecksum;
      return result;
    },
    async startGui(input) {
      const source = developmentSource(input.source);
      firstSource = source;
      try {
        firstManifest = await fileSnapshot(Fs.join(source.dir, 'dist.json'));
        expect(firstManifest).to.eql({ exists: true, integrity: firstManifestChecksum });
        await withPreviewHost(source, 'preview-real.first-complete', async (server) => {
          firstOrigin = server.origin;
          firstReady.resolve();
          await releaseFirst.promise;
        });
      } catch (cause) {
        firstReady.reject(cause);
        throw cause;
      }
      return 'quit';
    },
  });
  void firstRun.then(
    () => firstReady.reject(new Error('First preview session ended before readiness.')),
    firstReady.reject,
  );

  let proofFailure: unknown;
  let proofFailed = false;
  try {
    await firstReady.promise;
    const first = developmentSource(firstSource);
    const origin = firstOrigin;
    if (!origin) throw new Error('Expected first preview host origin.');

    const beforeSecond = await fetchText(origin);
    expect(beforeSecond.status).to.eql(200);

    await mainWith({
      paths,
      allocate: allocatePreviewGeneration,
      async build(input) {
        const result = await buildPreviewGeneration({ ...input, dependencyPolicy: 'frozen-cache' });
        if (result.ok) secondManifestChecksum = result.manifestChecksum;
        return result;
      },
      async startGui(input) {
        const source = developmentSource(input.source);
        secondSource = source;
        secondManifest = await fileSnapshot(Fs.join(source.dir, 'dist.json'));
        expect(secondManifest).to.eql({ exists: true, integrity: secondManifestChecksum });
        await withPreviewHost(source, 'preview-real.second-complete', async (server) => {
          const response = await fetchText(server.origin);
          expect(response.status).to.eql(200);
          secondBody = response.body;
        });
        return 'quit';
      },
    });

    const second = developmentSource(secondSource);
    const afterSecond = await fetchText(origin);
    expect(afterSecond).to.eql(beforeSecond);
    expect(secondBody.length).to.be.greaterThan(0);
    expect(first.dir).not.to.eql(second.dir);
    // Equal payloads retain content identity; build-time document bytes remain separate.
    expect(first.pin).to.eql(second.pin);
    expect(firstManifestChecksum).not.to.eql(secondManifestChecksum);
    expect(firstManifest).to.eql({ exists: true, integrity: firstManifestChecksum });
    expect(secondManifest).to.eql({ exists: true, integrity: secondManifestChecksum });
    const stillVerified = await FsDist.Pinned.verify({
      dir: first.dir,
      pin: first.pin,
      limits: START_GUI_SERVICE.limits,
    });
    expect(stillVerified.kind).to.eql('verified');
    if (stillVerified.kind !== 'verified') throw new Error('First preview no longer verifies.');
    expect(stillVerified.evidence.manifestChecksum).to.eql(firstManifestChecksum);
    expect(await fileSnapshot(Fs.join(first.dir, 'dist.json'))).to.eql(firstManifest);
    expect(await Fs.exists(first.dir)).to.eql(true);
    expect(await Fs.exists(second.dir)).to.eql(false);

    releaseFirst.resolve();
    await firstRun;
    expect(await Fs.exists(first.dir)).to.eql(false);
    expect(await directorySnapshot(SHARED_DIST)).to.eql(sharedBefore);
  } catch (cause) {
    proofFailed = true;
    proofFailure = cause;
  } finally {
    releaseFirst.resolve();
    try {
      await firstRun;
    } catch (cause) {
      if (proofFailed && proofFailure !== cause) {
        proofFailure = new AggregateError(
          [proofFailure, cause],
          'Real preview proof and first-session cleanup failed.',
        );
      } else if (!proofFailed) {
        proofFailed = true;
        proofFailure = cause;
      }
    }
  }
  if (proofFailed) throw proofFailure;
}

async function withPreviewHost(
  source: DevelopmentSource,
  reason: string,
  body: (server: t.DistServer.Started) => Promise<void>,
): Promise<void> {
  const server = await startHost(source);
  const failures: unknown[] = [];
  try {
    await body(server);
  } catch (cause) {
    failures.push(cause);
  }
  try {
    await server.close(reason);
  } catch (cause) {
    failures.push(cause);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Real preview host proof and cleanup failed.');
  }
}

function developmentSource(input: DevelopmentSource | undefined): DevelopmentSource {
  if (input?.kind !== 'development') throw new Error('Expected development preview evidence.');
  return input;
}

async function startHost(source: DevelopmentSource) {
  try {
    const snapshot = snapshotDevelopmentAuthority(source);
    if (!snapshot.ok) throw snapshot.failure.error;
    const authority = snapshot.authority;
    const server = await DistServer.start({
      dir: source.dir,
      pin: authority.pin,
      limits: START_GUI_SERVICE.limits,
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
    });
    try {
      const until = new AbortController().signal;
      expect(await admitApplicationPkg(authority, source.dir, server, until)).to.eql({
        origin: server.origin,
        digest: source.pin.digest,
      });
      const wrong = snapshotDevelopmentAuthority({
        ...source,
        expectedPkg: { ...source.expectedPkg, name: '@wrong/preview' },
      });
      if (!wrong.ok) throw wrong.failure.error;
      expect(await admitApplicationPkg(wrong.authority, source.dir, server, until)).to.eql(
        undefined,
      );
      return server;
    } catch (cause) {
      try {
        await server.close('preview-real.package-proof-failed');
      } catch (cleanup) {
        throw new AggregateError([cause, cleanup], 'Package proof and host cleanup failed.');
      }
      throw cause;
    }
  } catch (cause) {
    if (DistServer.Error.is(cause)) {
      throw new Error(`Real preview host failed: ${cause.reason}.`, { cause });
    }
    throw cause;
  }
}

/**
 * Exact shared-tree observation preserves absence and rejects links or special entries.
 */
async function directorySnapshot(dir: t.StringAbsoluteDir): Promise<DirectorySnapshot> {
  const root = await Fs.lstat(dir);
  if (!root) return Object.freeze({ kind: 'absent' });
  if (!root.isDirectory || root.isSymlink) {
    throw new Error(`Unsupported shared Dist root: ${dir}`);
  }

  const entries: DirectoryEntry[] = [];
  for await (
    const entry of Fs.walk(dir, {
      includeDirs: true,
      includeFiles: true,
      includeSymlinks: true,
      followSymlinks: false,
    })
  ) {
    const path = Fs.Path.relative(dir, entry.path);
    if (path === '') continue;
    if (entry.isDirectory) {
      entries.push(Object.freeze({ path, kind: 'directory' }));
      continue;
    }
    if (!entry.isFile) {
      throw new Error(`Unsupported shared Dist entry: ${path}`);
    }
    const file = await Fs.read(entry.path);
    if (!file.ok || !file.data) throw new Error(`Unable to snapshot shared Dist entry: ${path}`);
    entries.push(Object.freeze({ path, kind: 'file', integrity: Hash.sha256(file.data) }));
  }
  const compare = Str.Compare.codeUnit();
  return Object.freeze({
    kind: 'present',
    entries: Object.freeze(entries.sort((a, b) => compare(a.path, b.path))),
  });
}

async function snapshotRejection(dir: t.StringAbsoluteDir): Promise<Error> {
  try {
    await directorySnapshot(dir);
  } catch (cause) {
    return Is.error(cause) ? cause : new Error(String(cause));
  }
  throw new Error('Expected directory snapshot rejection.');
}

async function fileSnapshot(path: t.StringPath): Promise<FileSnapshot> {
  const result = await Fs.read(path);
  if (!result.ok || !result.data) return Object.freeze({ exists: false });
  return Object.freeze({ exists: true, integrity: Hash.sha256(result.data) });
}

async function fetchText(
  origin: t.StringUrl,
): Promise<{ readonly status: number; readonly body: string }> {
  const response = await fetch(origin);
  return Object.freeze({ status: response.status, body: await response.text() });
}
