import {
  describe,
  DistServer,
  expect,
  Fs,
  FsDist,
  it,
  Json,
  Open,
  Str,
  type t,
} from '../../common.ts';

import { default as deno } from '../../../deno.json' with { type: 'json' };
import { EsmAssert } from '../../../src/-test.ts';
import { pkg } from '../../../src/pkg.ts';
import { start, type StartGuiInput } from '../../../src/m.core/m.cli.profiles/u.start/u.gui.ts';
import {
  bootstrapStatusFixture,
  deferred,
} from '../../../src/m.core/m.cli.profiles/-test/u.fixture.start.gui.ts';
import { resolvePreviewDenoDir } from '../u.deno.ts';
import {
  mainWith,
  PACKAGE_ROOT,
  PREVIEW_BUILD_TEMP_PREFIX,
  PREVIEW_TEMP_PREFIX,
  type PreviewBuildInput,
  type PreviewBuildResponse,
  type PreviewDependencies,
  type PreviewGeneration,
  WORKSPACE_ROOT,
} from '../u.runtime.ts';
import { vitePaths } from '../../u.vite.paths.ts';

const FIRST_PIN = `sha256-${'1'.repeat(64)}` as t.StringHash;
const SECOND_PIN = `sha256-${'2'.repeat(64)}` as t.StringHash;
const FIRST_DIR = Fs.resolve(PACKAGE_ROOT, '.tmp/driver-pi-preview-one') as t.StringAbsoluteDir;
const SECOND_DIR = Fs.resolve(PACKAGE_ROOT, '.tmp/driver-pi-preview-two') as t.StringAbsoluteDir;
const INDEX_BODY = '<h1>verified local Driver Pi preview</h1>';
const MUTATED_INDEX_BODY = '<h1>mutated local Driver Pi preview</h1>';
const BASE_PATHS: PreviewDependencies['paths'] = vitePaths(PACKAGE_ROOT);
const PREVIEW_WORKER_ENTRY = new URL('../-entry.worker.ts', import.meta.url).pathname;

describe('driver-pi/scripts/task.start.gui.preview', () => {
  it('derives attributable filesystem-safe temp prefixes from the package name', () => {
    const owner = Str.replaceAll(pkg.name, '/', '-').after;
    expect(PREVIEW_TEMP_PREFIX).to.eql(`${owner}.start-gui-preview.`);
    expect(PREVIEW_BUILD_TEMP_PREFIX).to.eql(`${owner}.start-gui-preview-build.`);
  });

  it('keeps vendor environment authority finite outside isolated preview workers', () => {
    const permissions = deno.permissions as Record<string, { env?: unknown }>;
    expect(permissions['preview-launch'].env).to.eql(['DENO_DIR', 'SystemRoot']);
    expect(permissions['preview-worker'].env).to.eql(true);
    expect(permissions['preview-build'].env).to.eql(true);
    expect(Array.isArray(permissions['preview-worker'].env)).to.eql(false);
    expect(Array.isArray(permissions['preview-build'].env)).to.eql(false);
    const listed = Object.entries(permissions)
      .filter(([, value]) => Array.isArray(value.env))
      .map(([name]) => name);
    expect(listed).to.eql(['serve', 'serve-process', 'preview-launch']);
  });

  it('preserves explicit and materializes implicit Deno cache authority before sanitization', async () => {
    const expected = Fs.resolve(PACKAGE_ROOT, '.tmp/runtime-deno-cache') as t.StringAbsoluteDir;
    let invocation: t.Process.CaptureArgs | undefined;
    const actual = await resolvePreviewDenoDir(PACKAGE_ROOT, {
      getEnv: () => undefined,
      capture(input) {
        invocation = input;
        return Promise.resolve({
          outcome: 'exited',
          success: true,
          text: { stdout: Json.stringify({ denoDir: expected }), stderr: '' },
        });
      },
    });

    expect(actual).to.eql(expected);
    expect(
      await resolvePreviewDenoDir(PACKAGE_ROOT, {
        getEnv: () => expected,
        capture() {
          throw new Error('Explicit DENO_DIR must not require runtime discovery.');
        },
      }),
    ).to.eql(expected);
    expect(invocation).to.eql({
      cmd: Deno.execPath(),
      args: ['info', '--json'],
      cwd: PACKAGE_ROOT,
      clearEnv: false,
      env: { FORCE_COLOR: '0' },
      timeoutMs: 10_000,
      maxStdoutBytes: 64 * 1024,
      maxStderrBytes: 64 * 1024,
    });
  });

  it('rejects malformed Deno cache authority', async () => {
    const error = await rejectionOf(() =>
      resolvePreviewDenoDir(PACKAGE_ROOT, {
        getEnv: () => undefined,
        capture() {
          return Promise.resolve({
            outcome: 'exited',
            success: true,
            text: { stdout: Json.stringify({ denoDir: 'relative/cache' }), stderr: '' },
          });
        },
      })
    );

    expect(error.message).to.eql('start:gui:preview Deno cache authority unavailable.');
  });

  it('grants finite worker authority for every supported OS opener candidate', () => {
    const permissions = deno.permissions as Record<string, { run?: unknown }>;
    const target = 'https://127.0.0.1/' as t.StringUrl;
    expect(permissions['preview-worker'].run).to.eql([
      'deno',
      Open.resolveCommand(target, 'darwin').cmd,
      'wslview',
      Open.resolveCommand(target, 'linux').cmd,
      'powershell.exe',
      'cmd.exe',
      Open.resolveCommand(target, 'windows').cmd,
    ]);
  });

  it('keeps the long-lived preview host graph outside Vite build runtime', async () => {
    await EsmAssert.runtimeGraphOwnership({
      entry: PREVIEW_WORKER_ENTRY,
      ownedImports: ['./u.runtime.ts'],
    });
    await EsmAssert.runtimeGraphBoundary({
      entry: PREVIEW_WORKER_ENTRY,
      forbiddenImports: ['@sys/driver-vite'],
    });
  });

  it('builds once into its owned directory and passes only that generation to the GUI supervisor', async () => {
    const builds: PreviewBuildInput[] = [];
    const starts: unknown[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    await mainWith({
      paths: BASE_PATHS,
      allocate: () => Promise.resolve(generation(FIRST_DIR, disposals)),
      build(input) {
        builds.push(input);
        return Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN }));
      },
      startGui(input) {
        starts.push(input);
        return Promise.resolve();
      },
    });

    expect(builds).to.eql([{
      cwd: PACKAGE_ROOT,
      paths: {
        cwd: PACKAGE_ROOT,
        app: {
          entry: 'src/index.html',
          sw: 'src/-test/-sw.ts',
          outDir: FIRST_DIR,
          base: './',
        },
      },
      pkg,
      exitOnError: false,
    }]);
    expect(starts).to.eql([{
      cwd: { invoked: WORKSPACE_ROOT, git: WORKSPACE_ROOT },
      source: {
        kind: 'development',
        dir: FIRST_DIR,
        integrity: FIRST_PIN,
        expectedPkg: { name: pkg.name, version: pkg.version },
      },
    }]);
    expect(disposals).to.eql([FIRST_DIR]);
  });

  it('captures package-owner expectation before a hostile build callback', async () => {
    const starts: StartGuiInput[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    let mutated = true;
    await mainWith({
      paths: BASE_PATHS,
      allocate: () => Promise.resolve(generation(FIRST_DIR, disposals)),
      build(input) {
        mutated = Reflect.set(
          input.pkg as { name: string },
          'name',
          '@hostile/producer-selected',
        );
        return Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN }));
      },
      startGui(input) {
        starts.push(input);
        return Promise.resolve();
      },
    });

    expect(mutated).to.eql(false);
    const source = starts[0]?.source;
    if (source?.kind !== 'development') throw new Error('Expected development source.');
    expect(source.expectedPkg).to.eql({
      name: '@sys/driver-pi',
      version: pkg.version,
    });
    expect(disposals).to.eql([FIRST_DIR]);
  });

  it('captures distinct owned directories and build pins for consecutive preview sessions', async () => {
    const generations = [generation(FIRST_DIR), generation(SECOND_DIR)];
    const pins = [FIRST_PIN, SECOND_PIN];
    const starts: unknown[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    const deps: PreviewDependencies = {
      paths: BASE_PATHS,
      allocate() {
        const owner = generations.shift();
        if (!owner) throw new Error('Unexpected preview generation allocation.');
        return Promise.resolve(generation(owner.dir, disposals));
      },
      build(input) {
        const integrity = pins.shift();
        if (!integrity) throw new Error('Unexpected preview build.');
        return Promise.resolve(buildResult({ paths: input.paths, integrity }));
      },
      startGui(input) {
        starts.push(input.source);
        return Promise.resolve();
      },
    };
    await mainWith(deps);
    await mainWith(deps);

    expect(starts).to.eql([
      {
        kind: 'development',
        dir: FIRST_DIR,
        integrity: FIRST_PIN,
        expectedPkg: { name: pkg.name, version: pkg.version },
      },
      {
        kind: 'development',
        dir: SECOND_DIR,
        integrity: SECOND_PIN,
        expectedPkg: { name: pkg.name, version: pkg.version },
      },
    ]);
    expect(disposals).to.eql([FIRST_DIR, SECOND_DIR]);
  });

  it('cleans its owned generation without starting a host after a failed Vite build', async () => {
    let starts = 0;
    const disposals: t.StringAbsoluteDir[] = [];
    const error = await rejectionOf(() =>
      mainWith({
        paths: BASE_PATHS,
        allocate: () => Promise.resolve(generation(FIRST_DIR, disposals)),
        build(input) {
          return Promise.resolve(buildResult({
            paths: input.paths,
            integrity: FIRST_PIN,
            ok: false,
          }));
        },
        startGui() {
          starts += 1;
          return Promise.resolve();
        },
      })
    );

    expect(error.message).to.eql('start:gui:preview build failed.');
    expect({ starts, disposals }).to.eql({ starts: 0, disposals: [FIRST_DIR] });
  });

  it('refuses shared or mismatched build output before host startup and cleans only its owner', async () => {
    let starts = 0;
    const disposals: t.StringAbsoluteDir[] = [];
    const error = await rejectionOf(() =>
      mainWith({
        paths: BASE_PATHS,
        allocate: () => Promise.resolve(generation(FIRST_DIR, disposals)),
        build() {
          return Promise.resolve(buildResult({ paths: BASE_PATHS, integrity: FIRST_PIN }));
        },
        startGui() {
          starts += 1;
          return Promise.resolve();
        },
      })
    );

    expect(error.message).to.eql('start:gui:preview build output authority mismatch.');
    expect({ starts, disposals }).to.eql({ starts: 0, disposals: [FIRST_DIR] });
  });

  it('retains its generation through host settlement before cleanup', async () => {
    const entered = deferred();
    const release = deferred();
    const disposals: t.StringAbsoluteDir[] = [];
    const run = mainWith({
      paths: BASE_PATHS,
      allocate: () => Promise.resolve(generation(FIRST_DIR, disposals)),
      build: (input) => Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN })),
      async startGui() {
        entered.resolve();
        await release.promise;
      },
    });

    await entered.promise;
    expect(disposals).to.eql([]);
    release.resolve();
    await run;
    expect(disposals).to.eql([FIRST_DIR]);
  });

  it('hosts the exact local build directly and refuses post-start mutation without store work', async () => {
    const fixture = await previewDistFixture();
    let materializeCalls = 0;
    const applicationStarts: Pick<t.DistServer.Start.Args, 'dir' | 'integrity'>[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    let servedStatus = 0;
    let body = '';
    let changedStatus = 0;
    let changedBytes = -1;

    try {
      await mainWith({
        paths: BASE_PATHS,
        allocate: () => Promise.resolve(fixture.generation(disposals)),
        build: (input) =>
          Promise.resolve(buildResult({ paths: input.paths, integrity: fixture.integrity })),
        startGui: realStartGui({
          root: fixture.root,
          onMaterialize: () => {
            materializeCalls += 1;
          },
          onStart: (input) => {
            applicationStarts.push({ dir: input.dir, integrity: input.integrity });
          },
          async onReady(origin) {
            expect(await Fs.exists(fixture.dir)).to.eql(true);
            expect(await Fs.exists(Fs.join(fixture.root, '.pi'))).to.eql(false);

            const response = await fetch(origin);
            servedStatus = response.status;
            body = await response.text();

            await Fs.write(Fs.join(fixture.dir, 'index.html'), MUTATED_INDEX_BODY);
            const changed = await fetch(origin);
            changedStatus = changed.status;
            changedBytes = (await changed.arrayBuffer()).byteLength;
          },
        }),
      });

      expect({ materializeCalls, applicationStarts }).to.eql({
        materializeCalls: 0,
        applicationStarts: [{ dir: fixture.dir, integrity: fixture.integrity }],
      });
      expect({ servedStatus, body }).to.eql({ servedStatus: 200, body: INDEX_BODY });
      expect({ changedStatus, changedBytes }).to.eql({ changedStatus: 412, changedBytes: 0 });
      expect(disposals).to.eql([fixture.dir]);
      expect(await Fs.exists(fixture.dir)).to.eql(false);
      expect(await Fs.exists(fixture.root)).to.eql(true);
    } finally {
      await fixture.dispose();
    }
  });

  it('refuses wrong build pins and pre-start output mutation without release acquisition', async () => {
    const wrongPinFixture = await previewDistFixture();
    const changedOutputFixture = await previewDistFixture();
    let materializeCalls = 0;
    const applicationStarts: Pick<t.DistServer.Start.Args, 'dir' | 'integrity'>[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    const invoke = (fixture: PreviewDistFixture, integrity: t.StringHash) =>
      mainWith({
        paths: BASE_PATHS,
        allocate: () => Promise.resolve(fixture.generation(disposals)),
        build: (input) => Promise.resolve(buildResult({ paths: input.paths, integrity })),
        startGui: realStartGui({
          root: fixture.root,
          onMaterialize: () => {
            materializeCalls += 1;
          },
          onStart: (input) => {
            applicationStarts.push({ dir: input.dir, integrity: input.integrity });
          },
          onReady: () => Promise.reject(new Error('Expected preview host refusal.')),
        }),
      });

    try {
      expect(wrongPinFixture.integrity).not.to.eql(FIRST_PIN);
      const wrongPin = await rejectionOf(() => invoke(wrongPinFixture, FIRST_PIN));
      expect(wrongPin.message).to.eql('DistServer.start: pinned generation verification failed.');

      await Fs.write(
        Fs.join(changedOutputFixture.dir, 'index.html'),
        MUTATED_INDEX_BODY,
      );
      const changedOutput = await rejectionOf(() =>
        invoke(changedOutputFixture, changedOutputFixture.integrity)
      );
      expect(changedOutput.message).to.eql(
        'DistServer.start: pinned generation verification failed.',
      );

      expect({ materializeCalls, applicationStarts }).to.eql({
        materializeCalls: 0,
        applicationStarts: [
          { dir: wrongPinFixture.dir, integrity: FIRST_PIN },
          { dir: changedOutputFixture.dir, integrity: changedOutputFixture.integrity },
        ],
      });
      expect(disposals).to.eql([]);
      expect(await Fs.exists(Fs.join(wrongPinFixture.root, '.pi'))).to.eql(false);
      expect(await Fs.exists(Fs.join(changedOutputFixture.root, '.pi'))).to.eql(false);
      expect(await Fs.exists(wrongPinFixture.dir)).to.eql(true);
      expect(await Fs.exists(changedOutputFixture.dir)).to.eql(true);
    } finally {
      await disposeFixtures([wrongPinFixture, changedOutputFixture]);
    }
  });

  it('retains its generation when GUI invocation rejects without proving host settlement', async () => {
    const sessionFailure = new Error('preview session failed');
    let disposals = 0;
    const error = await rejectionOf(() =>
      mainWith({
        paths: BASE_PATHS,
        allocate: () =>
          Promise.resolve(Object.freeze({
            dir: FIRST_DIR,
            dispose() {
              disposals += 1;
              return Promise.resolve();
            },
          })),
        build: (input) =>
          Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN })),
        startGui: () => Promise.reject(sessionFailure),
      })
    );

    expect(error).to.equal(sessionFailure);
    expect(disposals).to.eql(0);
  });

  it('preserves a pre-host build failure when confined cleanup also fails', async () => {
    const cleanupFailure = new Error('preview cleanup failed');
    const error = await rejectionOf(() =>
      mainWith({
        paths: BASE_PATHS,
        allocate: () =>
          Promise.resolve(Object.freeze({
            dir: FIRST_DIR,
            dispose: () => Promise.reject(cleanupFailure),
          })),
        build: (input) =>
          Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN, ok: false })),
        startGui: () => Promise.resolve(),
      })
    );

    expect(error).to.be.instanceOf(AggregateError);
    expect(error.message).to.eql('start:gui:preview session and cleanup failed.');
    expect((error as AggregateError).errors[0]).to.be.instanceOf(Error);
    expect(((error as AggregateError).errors[0] as Error).message).to.eql(
      'start:gui:preview build failed.',
    );
    expect((error as AggregateError).errors[1]).to.equal(cleanupFailure);
  });
});

function buildResult(input: {
  readonly paths: PreviewDependencies['paths'];
  readonly integrity: t.StringHash;
  readonly ok?: boolean;
}): PreviewBuildResponse {
  return {
    ok: input.ok ?? true,
    paths: input.paths,
    manifest: { integrity: input.integrity },
  };
}

function generation(
  dir: t.StringAbsoluteDir,
  disposals: t.StringAbsoluteDir[] = [],
): PreviewGeneration {
  return Object.freeze({
    dir,
    dispose() {
      disposals.push(dir);
      return Promise.resolve();
    },
  });
}

type RealStartGuiOptions = Readonly<{
  root: t.StringAbsoluteDir;
  onMaterialize: () => void;
  onStart: (input: t.DistServer.Start.Args) => void;
  onReady: (origin: t.StringUrl) => Promise<void>;
}>;

function realStartGui(options: RealStartGuiOptions): (input: StartGuiInput) => Promise<void> {
  return async (input) => {
    const stop = new AbortController();
    const keyboard = deferred();
    const terminal = deferred();
    const status = bootstrapStatusFixture();
    let terminalObserved = false;
    let releaseState: (() => void) | undefined;

    const session = start({
      ...input,
      cwd: Object.freeze({ root: options.root, git: options.root, invoked: options.root }),
      until: stop.signal,
      deps: {
        materialize() {
          options.onMaterialize();
          throw new Error('Development preview must not materialize release evidence.');
        },
        start(input) {
          options.onStart(input);
          return DistServer.start(input);
        },
        startStatus: () => Promise.resolve(status),
        open() {},
        bindKeyboard() {
          return {
            finished: keyboard.promise,
            dispose: keyboard.resolve,
          };
        },
        createScreen(input) {
          releaseState = input.state.subscribe((state) => {
            if (terminalObserved || (state.kind !== 'ready' && state.kind !== 'failed')) return;
            terminalObserved = true;
            if (state.kind === 'failed') {
              terminal.resolve();
              stop.abort('preview-test.host-refused');
              return;
            }
            void observeReady(state.origin);
          });
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {},
            warnOpen() {},
            dispose() {
              releaseState?.();
              releaseState = undefined;
            },
          };
        },
      },
    });

    const observedSession = observeSession();
    const [sessionResult, terminalResult] = await Promise.allSettled([
      observedSession,
      terminal.promise,
    ]);
    if (sessionResult.status === 'rejected') throw sessionResult.reason;
    if (terminalResult.status === 'rejected') throw terminalResult.reason;

    async function observeSession(): Promise<void> {
      try {
        await session;
      } catch (cause) {
        if (!terminalObserved) terminal.reject(cause);
        throw cause;
      }
      if (!terminalObserved) {
        terminal.reject(new Error('Preview session ended before host evidence.'));
      }
    }

    async function observeReady(origin: t.StringUrl): Promise<void> {
      try {
        await options.onReady(origin);
        terminal.resolve();
      } catch (cause) {
        terminal.reject(cause);
      } finally {
        stop.abort('preview-test.probe-complete');
      }
    }
  };
}

type PreviewDistFixture = Readonly<{
  root: t.StringAbsoluteDir;
  dir: t.StringAbsoluteDir;
  integrity: t.StringHash;
  generation(disposals?: t.StringAbsoluteDir[]): PreviewGeneration;
  dispose(): Promise<void>;
}>;

async function previewDistFixture(): Promise<PreviewDistFixture> {
  const temporary = (await Fs.makeTempDir({ prefix: 'driver-pi.start-gui.preview.' })).absolute;
  const root = await Fs.realPath(temporary) as t.StringAbsoluteDir;
  const dir = Fs.join(root, 'build') as t.StringAbsoluteDir;
  try {
    await Fs.ensureDir(dir);
    await Fs.write(Fs.join(dir, 'index.html'), INDEX_BODY);
    await Fs.write(
      Fs.join(dir, 'sw.js'),
      `self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));`,
    );
    const computed = await FsDist.compute({ dir, pkg, builder: pkg, save: true });
    if (computed.error) throw computed.error;
    return Object.freeze({
      root,
      dir,
      integrity: computed.manifest.integrity,
      generation(disposals: t.StringAbsoluteDir[] = []) {
        return Object.freeze({
          dir,
          async dispose() {
            disposals.push(dir);
            await Fs.remove(dir);
          },
        });
      },
      dispose: async () => {
        await Fs.remove(root);
      },
    });
  } catch (cause) {
    try {
      await Fs.remove(root);
    } catch (cleanupCause) {
      throw new AggregateError([cause, cleanupCause], 'Preview Dist fixture setup failed.');
    }
    throw cause;
  }
}

async function disposeFixtures(fixtures: readonly PreviewDistFixture[]): Promise<void> {
  const failures: unknown[] = [];
  for (const fixture of fixtures) {
    try {
      await fixture.dispose();
    } catch (cause) {
      failures.push(cause);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, 'Preview fixture cleanup failed.');
}

async function rejectionOf(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (cause) {
    return cause instanceof Error ? cause : new Error(String(cause));
  }
  throw new Error('Expected rejection.');
}
