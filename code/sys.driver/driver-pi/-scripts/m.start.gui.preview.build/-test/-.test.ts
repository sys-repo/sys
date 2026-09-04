import { describe, DistServer, expect, Fs, FsDist, Is, it, Json, Open, Str } from '../../common.ts';

import { default as deno } from '../../../deno.json' with { type: 'json' };
import { EsmAssert } from '../../../src/-test.ts';
import { pkg } from '../../../src/pkg.ts';
import { startDevelopmentWith } from '../../../src/m.cli/m.profiles/u.start/u.gui/mod.ts';
import type { Start } from '../../../src/m.cli/m.profiles/u.start/u.gui/t.ts';
import { StartGuiPresentation } from '../../../src/m.cli/m.profiles/u.start/u.gui/u.presentation.ts';
import {
  bootstrapStatusFixture,
  deferred,
} from '../../../src/m.cli/m.profiles/-test/u.fixture.start.gui.ts';
import type { t } from '../common.ts';
import { resolvePreviewDenoDir } from '../u.deno.ts';
import {
  main,
  mainWith,
  PACKAGE_ROOT,
  PREVIEW_BUILD_TEMP_PREFIX,
  PREVIEW_TEMP_PREFIX,
  WORKSPACE_ROOT,
} from '../u.runtime.ts';
import { vitePaths } from '../../u.vite.paths.ts';

type StartGuiFixtureOptions = {
  readonly root: t.StringAbsoluteDir;
  readonly onOpenGeneration: () => void;
  readonly onStart: (input: t.DistServer.Start.Args) => void;
  readonly onReady: (origin: t.StringUrl) => Promise<void>;
  readonly statusFailureAfterReady?: Error;
  readonly onLifecycleEvent?: (event: string) => void;
};

type PreviewDistFixture = {
  readonly root: t.StringAbsoluteDir;
  readonly dir: t.StringAbsoluteDir;
  readonly integrity: t.StringHash;
  readonly generation: (disposals?: t.StringAbsoluteDir[]) => t.PreviewGeneration;
  readonly dispose: () => Promise<void>;
};

const FIRST_PIN: t.StringHash = `sha256-${'1'.repeat(64)}`;
const SECOND_PIN: t.StringHash = `sha256-${'2'.repeat(64)}`;
const FIRST_DIR: t.StringAbsoluteDir = Fs.resolve(PACKAGE_ROOT, '.tmp/driver-pi-preview-one');
const SECOND_DIR: t.StringAbsoluteDir = Fs.resolve(PACKAGE_ROOT, '.tmp/driver-pi-preview-two');
const INDEX_BODY = '<h1>verified local Driver Pi preview</h1>';
const MUTATED_INDEX_BODY = '<h1>mutated local Driver Pi preview</h1>';
const BASE_PATHS: t.PreviewBuildPaths = vitePaths(PACKAGE_ROOT);
const PREVIEW_WORKER_ENTRY = new URL('../-entry.worker.ts', import.meta.url).pathname;

describe('driver-pi/scripts/task.start.gui.preview', () => {
  it('deeply freezes Vite paths at the owner boundary', () => {
    const paths = vitePaths(PACKAGE_ROOT, FIRST_DIR);

    expect(paths.app.outDir).to.eql(FIRST_DIR);
    expect(Object.isFrozen(paths)).to.eql(true);
    expect(Object.isFrozen(paths.app)).to.eql(true);
  });

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
    expect(Is.array(permissions['preview-worker'].env)).to.eql(false);
    expect(Is.array(permissions['preview-build'].env)).to.eql(false);
  });

  it('preserves explicit and materializes implicit Deno cache authority before sanitization', async () => {
    const expected: t.StringAbsoluteDir = Fs.resolve(PACKAGE_ROOT, '.tmp/runtime-deno-cache');
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
    const explicit = await resolvePreviewDenoDir(PACKAGE_ROOT, {
      getEnv: () => expected,
      capture() {
        throw new Error('Explicit DENO_DIR must not require runtime discovery.');
      },
    });
    expect(explicit).to.eql(expected);
    expect(invocation).to.eql({
      cmd: Deno.execPath(),
      args: ['info', '--json'],
      cwd: PACKAGE_ROOT,
      clearEnv: false,
      env: { FORCE_COLOR: '0' },
      executionTimeout: 10_000,
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
    const target: t.StringUrl = 'https://127.0.0.1/';
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
      forbiddenPathIncludes: [
        '/m.cli/m.profiles/u/u.menu.ts',
        '\\m.cli\\m.profiles\\u\\u.menu.ts',
      ],
    });
  });

  it('builds once into its owned directory and passes only that generation to the GUI session', async () => {
    const builds: t.PreviewBuildInput[] = [];
    const starts: t.PreviewStartInput[] = [];
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
        return Promise.resolve('quit');
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

  it('returns every resolved GUI outcome only after removing its owned generation', async () => {
    const outcomes: readonly t.Start.Gui.Outcome[] = [
      'back',
      'quit',
      'external-cancellation',
      'failed',
    ];
    const settled: string[] = [];

    for (const outcome of outcomes) {
      const result = await mainWith({
        paths: BASE_PATHS,
        allocate: () =>
          Promise.resolve(Object.freeze({
            dir: FIRST_DIR,
            dispose() {
              settled.push(`dispose:${outcome}`);
              return Promise.resolve();
            },
          })),
        build: (input) =>
          Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN })),
        startGui() {
          settled.push(`outcome:${outcome}`);
          return Promise.resolve(outcome);
        },
      });
      expect(result).to.eql(outcome);
    }

    expect(settled).to.eql(outcomes.flatMap((outcome) => [
      `outcome:${outcome}`,
      `dispose:${outcome}`,
    ]));
  });

  it('projects failed preview status only after temporary-generation cleanup', async () => {
    const previousExitCode = Deno.exitCode;
    let exitCodeDuringCleanup = -1;
    try {
      Deno.exitCode = 0;
      await main({
        paths: BASE_PATHS,
        allocate: () =>
          Promise.resolve(Object.freeze({
            dir: FIRST_DIR,
            dispose() {
              exitCodeDuringCleanup = Deno.exitCode;
              return Promise.resolve();
            },
          })),
        build: (input) =>
          Promise.resolve(buildResult({ paths: input.paths, integrity: FIRST_PIN })),
        startGui: () => Promise.resolve('failed'),
      });

      expect(exitCodeDuringCleanup).to.eql(0);
      expect(Deno.exitCode).to.eql(1);
    } finally {
      Deno.exitCode = previousExitCode;
    }
  });

  it('preserves generated package identity through a hostile build callback', async () => {
    const starts: t.PreviewStartInput[] = [];
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
        return Promise.resolve('quit');
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
    const starts: t.PreviewDevelopmentSource[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    const deps: t.PreviewDependencies = {
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
        return Promise.resolve('quit');
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
          return Promise.resolve('quit');
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
          return Promise.resolve('quit');
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
        return 'quit';
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
    let generationOpenCalls = 0;
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
        startGui: startGuiFixture({
          root: fixture.root,
          onOpenGeneration() {
            generationOpenCalls += 1;
          },
          onStart(input) {
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

      expect({ generationOpenCalls, applicationStarts }).to.eql({
        generationOpenCalls: 0,
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

  it('requests presentation shutdown before a clean real-host close', async () => {
    await proveRealShutdownOrder('clean');
  });

  it('quiesces a fatally failed real host before presenting its failure', async () => {
    await proveRealShutdownOrder('fatal');
  });

  it('refuses wrong build pins and pre-start output mutation without release acquisition', async () => {
    const wrongPinFixture = await previewDistFixture();
    const changedOutputFixture = await previewDistFixture();
    let generationOpenCalls = 0;
    const applicationStarts: Pick<t.DistServer.Start.Args, 'dir' | 'integrity'>[] = [];
    const disposals: t.StringAbsoluteDir[] = [];
    const invoke = (fixture: PreviewDistFixture, integrity: t.StringHash) =>
      mainWith({
        paths: BASE_PATHS,
        allocate: () => Promise.resolve(fixture.generation(disposals)),
        build: (input) => Promise.resolve(buildResult({ paths: input.paths, integrity })),
        startGui: startGuiFixture({
          root: fixture.root,
          onOpenGeneration() {
            generationOpenCalls += 1;
          },
          onStart(input) {
            applicationStarts.push({ dir: input.dir, integrity: input.integrity });
          },
          onReady: () => Promise.reject(new Error('Expected preview host refusal.')),
        }),
      });

    try {
      expect(wrongPinFixture.integrity).not.to.eql(FIRST_PIN);
      expect(await invoke(wrongPinFixture, FIRST_PIN)).to.eql('failed');

      await Fs.write(
        Fs.join(changedOutputFixture.dir, 'index.html'),
        MUTATED_INDEX_BODY,
      );
      expect(await invoke(changedOutputFixture, changedOutputFixture.integrity)).to.eql('failed');

      expect({ generationOpenCalls, applicationStarts }).to.eql({
        generationOpenCalls: 0,
        applicationStarts: [
          { dir: wrongPinFixture.dir, integrity: FIRST_PIN },
          { dir: changedOutputFixture.dir, integrity: changedOutputFixture.integrity },
        ],
      });
      expect(disposals).to.eql([wrongPinFixture.dir, changedOutputFixture.dir]);
      expect(await Fs.exists(Fs.join(wrongPinFixture.root, '.pi'))).to.eql(false);
      expect(await Fs.exists(Fs.join(changedOutputFixture.root, '.pi'))).to.eql(false);
      expect(await Fs.exists(wrongPinFixture.dir)).to.eql(false);
      expect(await Fs.exists(changedOutputFixture.dir)).to.eql(false);
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
        startGui: () => Promise.resolve('quit'),
      })
    );

    expect(error).to.be.instanceOf(SuppressedError);
    expect(error.message).to.eql('start:gui:preview preparation and cleanup failed.');
    expect((error as SuppressedError).error).to.be.instanceOf(Error);
    expect(((error as SuppressedError).error as Error).message).to.eql(
      'start:gui:preview build failed.',
    );
    expect((error as SuppressedError).suppressed).to.equal(cleanupFailure);
  });
});

function buildResult(input: {
  readonly paths: t.PreviewBuildPaths;
  readonly integrity: t.StringHash;
  readonly ok?: boolean;
}): t.PreviewBuildResponse {
  return {
    ok: input.ok ?? true,
    paths: input.paths,
    manifest: { integrity: input.integrity },
  };
}

function generation(
  dir: t.StringAbsoluteDir,
  disposals: t.StringAbsoluteDir[] = [],
): t.PreviewGeneration {
  return Object.freeze({
    dir,
    dispose() {
      disposals.push(dir);
      return Promise.resolve();
    },
  });
}

async function proveRealShutdownOrder(mode: 'clean' | 'fatal'): Promise<void> {
  const fixture = await previewDistFixture();
  const events: string[] = [];
  const statusFailure = new Error('real-host status listener failed');
  const start = startGuiFixture({
    root: fixture.root,
    onOpenGeneration() {
      throw new Error('Development preview must not open release evidence.');
    },
    onStart() {},
    async onReady(origin) {
      const response = await fetch(origin);
      expect(response.status).to.eql(200);
      await response.body?.cancel();
    },
    ...(mode === 'fatal' ? { statusFailureAfterReady: statusFailure } : {}),
    onLifecycleEvent: (event) => events.push(event),
  });
  const invoke = () =>
    start({
      cwd: Object.freeze({ invoked: fixture.root, git: fixture.root }),
      source: Object.freeze({
        kind: 'development',
        dir: fixture.dir,
        integrity: fixture.integrity,
        expectedPkg: pkg,
      }),
    });

  try {
    if (mode === 'clean') {
      expect(await invoke()).to.eql('quit');
      expectBefore(events, 'presentation.shutdown', 'application.close');
      expectBefore(events, 'application.close', 'application.abort');
    } else {
      expect(await rejectionOf(invoke)).to.equal(statusFailure);
      expectBefore(events, 'application.close', 'application.abort');
      expectBefore(events, 'application.abort', 'presentation.failed');
      expectBefore(events, 'presentation.failed', 'presentation.shutdown');
    }
    expect(events).to.contain('application.finished');
  } finally {
    await fixture.dispose();
  }
}

function startGuiFixture(options: StartGuiFixtureOptions): t.PreviewGuiStart {
  return async (input) => {
    const stop = new AbortController();
    const probe = deferred();
    const statusCompletion = options.statusFailureAfterReady ? deferred() : undefined;
    const status = statusCompletion
      ? bootstrapStatusFixture({ finished: statusCompletion.promise })
      : bootstrapStatusFixture();
    const lost = new Promise<never>(() => undefined);
    let controls: Start.Gui.Presentation.Input | undefined;
    let state: Start.Gui.Presentation.State = Object.freeze({ kind: 'preparing' });

    const owner: Start.Gui.Presentation.Owner = Object.freeze({
      lost,
      get current() {
        return state;
      },
      starting() {
        state = Object.freeze({ kind: 'starting-app-host' });
      },
      ready(ready) {
        state = Object.freeze({ kind: 'ready', ...ready });
        options.onLifecycleEvent?.('presentation.ready');
        void observeReady(ready.origin);
      },
      failed(failure) {
        options.onLifecycleEvent?.('presentation.failed');
        state = Object.freeze({
          kind: 'failed',
          category: failure.category,
          safeEvidence: failure.evidence,
        });
        controls?.onDismiss();
        probe.resolve();
      },
      warnOpen() {},
      redraw() {},
      shutdown() {
        options.onLifecycleEvent?.('presentation.shutdown');
        return Promise.resolve();
      },
    });
    const presentation: Start.Gui.Dependencies['presentation'] = Object.freeze({
      ...StartGuiPresentation,
      prepare(input: Start.Gui.Presentation.Input) {
        controls = input;
        return Object.freeze({
          status: Object.freeze({
            pages: Object.freeze([]),
            resolve: () => Object.freeze({ kind: 'page', key: 'preparing' }),
          }),
          acquire: () => Promise.resolve(owner),
        });
      },
    });
    const deps: Start.Gui.Dependencies = Object.freeze({
      runtimeRoot: () => options.root,
      startStatus: () => Promise.resolve(status),
      openGeneration() {
        options.onOpenGeneration();
        throw new Error('Development preview must not open release evidence.');
      },
      async startApplication(input) {
        options.onStart(input);
        if (Is.abortSignal(input.until)) {
          input.until.addEventListener(
            'abort',
            () => options.onLifecycleEvent?.('application.abort'),
            { once: true },
          );
        }
        const started = await DistServer.start(input);
        const finished = started.finished.then(
          () => options.onLifecycleEvent?.('application.finished'),
          (cause) => {
            options.onLifecycleEvent?.('application.finished');
            throw cause;
          },
        );
        return Object.freeze({
          ...started,
          finished,
          close(reason?: unknown) {
            options.onLifecycleEvent?.('application.close');
            return started.close(reason);
          },
        });
      },
      isHostError: DistServer.Error.is,
      openBrowser() {},
      presentation,
    });

    const session = startDevelopmentWith({
      ...input,
      cwd: Object.freeze({ root: options.root, git: options.root, invoked: options.root }),
      until: stop.signal,
    }, deps);
    const [sessionResult, probeResult] = await Promise.allSettled([session, probe.promise]);
    if (probeResult.status === 'rejected') throw probeResult.reason;
    if (sessionResult.status === 'rejected') throw sessionResult.reason;
    return sessionResult.value;

    async function observeReady(origin: t.StringUrl): Promise<void> {
      try {
        await options.onReady(origin);
        if (options.statusFailureAfterReady && statusCompletion) {
          options.onLifecycleEvent?.('status.failed');
          statusCompletion.reject(options.statusFailureAfterReady);
        } else {
          controls?.onQuit();
          probe.resolve();
        }
      } catch (cause) {
        probe.reject(cause);
        stop.abort('preview-test.probe-failed');
      }
    }
  };
}

async function previewDistFixture(): Promise<PreviewDistFixture> {
  const temporary = (await Fs.makeTempDir({ prefix: 'driver-pi.start-gui.preview.' })).absolute;
  const root: t.StringAbsoluteDir = await Fs.realPath(temporary);
  const dir: t.StringAbsoluteDir = Fs.join(root, 'build');
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
      async dispose() {
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

function expectBefore(events: readonly string[], before: string, after: string): void {
  const beforeIndex = events.indexOf(before);
  const afterIndex = events.indexOf(after);
  expect(beforeIndex).to.be.greaterThan(-1);
  expect(afterIndex).to.be.greaterThan(beforeIndex);
}

async function rejectionOf(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (cause) {
    return Is.error(cause) ? cause : new Error(String(cause));
  }
  throw new Error('Expected rejection.');
}
