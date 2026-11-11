import { Path } from '@sys/std/path';
import {
  Cli,
  describe,
  Err,
  expect,
  Fs,
  Hash,
  Is,
  it,
  Json,
  Obj,
  Process,
  Str,
  type t,
} from '../common.ts';
import { preloadSources } from './u.host.preload.ts';

type Mode = 'none' | 'persistent' | 'startup';
type Files = Readonly<Record<string, string>>;
type RunOptions = {
  module?: string;
  facade?: 'syntax' | 'evaluation' | 'missing-dependency';
  blockWrite?: 'preload.mjs' | 'facade.mjs';
};
type Receipt = {
  readonly name: string;
  readonly mode: Mode;
  readonly root: string;
  readonly args: readonly string[];
  readonly env: t.Process.Env;
  readonly artifacts: Readonly<Record<string, string>>;
  readonly outcome: t.Process.CaptureOutput['outcome'];
  readonly termination: t.Process.CaptureOutput['termination'];
  readonly code: number | null;
  readonly signal: Deno.Signal | null;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
  readonly raw: { readonly stdout: string; readonly stderr: string };
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: unknown;
};

const CACHE_CALL = "import { enableCompileCache } from 'node:module'; enableCompileCache();";
const MODES = ['none', 'persistent', 'startup'] as const;
const ARGV = ['fixture-argument', '', 'two words', '--', '--preload=literal', 'quote"apostrophe\''];

describe('Pi: scoped compile-cache preload investigation', () => {
  it('fresh-process controls → a verdict for the closed synthetic startup graph only', async () => {
    const parent = Fs.resolve(import.meta.dirname ?? '.', '../../.tmp');
    await Fs.ensureDir(parent);
    const root = (await Fs.makeTempDir({ dir: parent, prefix: 'preload-proof.' })).absolute;
    const receipts: Receipt[] = [];
    let captureAttempts = 0;
    console.info(`PRELOAD evidence retained: ${root}`);
    await Fs.write(
      Fs.join(root, 'runtime.json'),
      Json.stringify({
        deno: Deno.version,
        platform: Deno.build,
        executable: Deno.execPath(),
      }),
      { throw: true },
    );
    // A crash, failed assertion, permission denial, or incomplete child never leaves a success receipt.
    await verdict('blocked/inconclusive', 'Investigation has not completed.');

    await proveLinkAndWindow();
    await proveControls();
    await proveMatchingAndRepetition();
    await proveControlledSurfacesAndErrors();
    await proveCandidateFailures();
    await proveIdentityAndAuthority();
    await proveConcurrentLaunches();
    await proveCheckedWrites();
    await verdict(
      'supported candidate',
      'Startup lifetime only, closed synthetic graph on this runtime. Persistent hooks and ' +
        'in-window unrelated work are disqualified. Injected ESM hook exceptions are suppressed; ' +
        'no general hook-error guarantee. Official npm-bin startup remains untested.',
    );

    async function proveLinkAndWindow() {
      const files = {
        // Deliberately mirrors the official ESM → createRequire bootstrap, without Pi artifacts.
        'cli.mjs': Str.dedent(`
          import { createRequire, enableCompileCache } from 'node:module';
          console.info('CACHE ' + JSON.stringify(enableCompileCache()));
          createRequire(import.meta.url)('./runtime.cjs')(createRequire);
        `),
        // CommonJS here is the interop contract under test, not package implementation style.
        'runtime.cjs': Str.dedent(`
          const { createRequire } = require('node:module');
          module.exports = (received) => {
            console.info('BINDING ' + (received === createRequire));
            console.info('RUNTIME entered');
          };
        `),
      };
      const baseline = await run('link', 'none', files);
      expectMissingExport(baseline);
      expect(baseline.stdout).to.eql('');
      const persistent = await run('link', 'persistent', files);
      const startup = await run('link', 'startup', files);
      for (const candidate of [persistent, startup]) {
        expectSuccess(candidate);
        expect(candidate.stdout).to.include('PRELOAD registered');
        expect(candidate.stdout).to.include('CACHE {"status":3}');
        expect(candidate.stdout).to.include('BINDING true');
        expect(candidate.stdout).to.include('RUNTIME entered');
        expect(candidate.stdout).to.include(`PRELOAD main ${url(candidate, 'cli.mjs')}`);
      }
      // Closed active graph: main → facade → already-evaluated builtin and preload.
      // No other user module, await, task scheduling, or runtime require precedes disable().
      // Exact edge accounting supplements source inspection; silence after disable alone is not proof.
      expect(events(startup, 'PRELOAD resolve ')).to.eql([
        { specifier: 'node:module', parent: url(startup, 'cli.mjs') },
        { specifier: 'node:module', parent: url(startup, 'facade.mjs') },
        { specifier: './preload.mjs', parent: url(startup, 'facade.mjs') },
      ]);
      expectBefore(startup, 'PRELOAD registered', 'PRELOAD resolve ');
      expectBefore(startup, 'PRELOAD resolve ', 'PRELOAD deregistered');
      expectBefore(startup, 'PRELOAD deregistered', 'CACHE ');
      expectBefore(startup, 'CACHE ', 'RUNTIME entered');
    }

    async function proveControls() {
      // The unrelated importer never imports the missing API, so it cannot mask loader failures.
      for (const control of ['bare', 'attribute'] as const) {
        const unrelated = Str.dedent(`
          console.info('CONTROL attempted');
          ${
          control === 'bare'
            ? "await import('neighbor' + '.mjs');"
            : "await import('./neighbor.mjs', { with: { unsupported: 'value' } });"
        }
          console.info('CONTROL completed');
        `);
        const controls: Receipt[] = [];
        for (const mode of MODES) {
          controls.push(
            await run(control, mode, {
              'cli.mjs': Str.dedent(`
              ${mode === 'startup' ? CACHE_CALL : ''}
              await import('./unrelated.mjs');
            `),
              'unrelated.mjs': unrelated,
              'neighbor.mjs': "console.info('NEIGHBOR executed'); export const value = 1;",
            }),
          );
        }
        const [baseline, persistent, startup] = controls;
        const reason = control === 'bare'
          ? 'Import "neighbor.mjs" not a dependency'
          : '"unsupported" attribute is not supported.';
        for (const rejected of [baseline, startup]) {
          expect(rejected.stdout).to.include('CONTROL attempted');
          expect(rejected.stdout).not.to.include('NEIGHBOR executed');
          expect(rejected.stdout).not.to.include('CONTROL completed');
          expect(rejected.code, rejected.stderr).to.eql(1);
          expect(rejected.stderr).to.include(`TypeError: ${reason}`);
          expect(rejected.stderr).to.include('unrelated.mjs:2:1');
        }
        expectBefore(startup, 'PRELOAD deregistered', 'CONTROL attempted');
        // This green diagnostic assertion DISQUALIFIES persistent hooks; it is not a candidate pass.
        expectSuccess(persistent);
        expectBefore(persistent, 'CONTROL attempted', 'NEIGHBOR executed');
        expectBefore(persistent, 'NEIGHBOR executed', 'CONTROL completed');

        // A shorter lifetime does not repair imports which can execute inside the active window.
        const inWindow = await run(`${control}-in-window`, 'startup', {
          'cli.mjs': Str.dedent(`
            import { enableCompileCache } from 'node:module';
            await import('./unrelated.mjs');
            enableCompileCache();
          `),
          'unrelated.mjs': unrelated,
          'neighbor.mjs': "console.info('NEIGHBOR executed'); export const value = 1;",
        });
        expectSuccess(inWindow);
        expectBefore(inWindow, 'CONTROL attempted', 'NEIGHBOR executed');
        expectBefore(inWindow, 'CONTROL completed', 'PRELOAD deregistered');
      }
    }

    async function proveMatchingAndRepetition() {
      const nonmatch = await run('same-filename-nonmatch', 'persistent', {
        'cli.mjs': "await import('./other/cli.mjs');",
        'other/cli.mjs': Str.dedent(`
          import { enableCompileCache } from 'node:module';
          console.info('NONMATCH executed');
          enableCompileCache();
        `),
      });
      expectMissingExport(nonmatch);
      expect(nonmatch.stderr).to.include('other/cli.mjs:1:10');
      expect(nonmatch.stdout).not.to.include('NONMATCH executed');
      expect(events(nonmatch, 'PRELOAD resolve ')).to.include.deep.members([
        { specifier: 'node:module', parent: url(nonmatch, 'other/cli.mjs') },
      ]);

      for (const mode of ['persistent', 'startup'] as const) {
        const repeated = await run('repeated-resolution', mode, {
          'cli.mjs': Str.dedent(`
            import { enableCompileCache } from 'node:module';
            // Diagnostic repeated linking before the first call; not an expanded supported graph.
            // Namespace access inspects an optional export without imposing another named link.
            const resolutions = [await import('node:' + 'module'), await import('node:' + 'module')];
            for (const [index, again] of resolutions.entries()) {
              console.info('REPEAT ' + JSON.stringify({
                count: index + 1, same: again.enableCompileCache === enableCompileCache,
                result: again.enableCompileCache(),
              }));
            }
          `),
        });
        expectSuccess(repeated);
        expect(events(repeated, 'REPEAT ')).to.eql([
          { count: 1, same: true, result: { status: 3 } },
          { count: 2, same: true, result: { status: 3 } },
        ]);
        const edges = events(repeated, 'PRELOAD resolve ');
        expect(edges.filter((edge) => Is.record(edge) && edge.parent === url(repeated, 'cli.mjs')))
          .to.have.length(3);
        if (mode === 'startup') {
          expectBefore(repeated, 'PRELOAD deregistered', 'REPEAT ');
          expect(repeated.stdout.split('PRELOAD deregistered')).to.have.length(2);
        }
      }

      for (const mode of MODES) {
        const mapped = await run('mapped-delegation', mode, {
          'cli.mjs': Str.dedent(`
            ${mode === 'startup' ? CACHE_CALL : ''}
            console.info('MAPPED ' + (await import('mapped-local')).value);
          `),
        });
        expectSuccess(mapped);
        expect(mapped.stdout).to.include('MAPPED local-value');
      }
      const after = await run('repeat-after-disable', 'startup', {
        'cli.mjs': Str.dedent(`
          import { enableCompileCache } from 'node:module';
          console.info('CACHE ' + JSON.stringify(enableCompileCache()));
          console.info('CACHE ' + JSON.stringify(enableCompileCache()));
          // Named-importing a missing export would prevent observing the real builtin surface.
          const real = await import('node:' + 'module');
          console.info('UNMODIFIED ' + !('enableCompileCache' in real));
        `),
      });
      expectSuccess(after);
      expect(events(after, 'CACHE ')).to.eql([{ status: 3 }, { status: 3 }]);
      expect(after.stdout.split('PRELOAD deregistered')).to.have.length(2);
      expect(after.stdout).to.include('UNMODIFIED true');
    }

    async function proveControlledSurfacesAndErrors() {
      // These are independently controlled local modules, NOT alternative Deno runtime observations.
      const presentCases = [
        [
          'callable',
          "export function enableCompileCache() { console.info('REAL called'); return { status: 1 }; }",
        ],
        ['throwing', "export function enableCompileCache() { throw new Error('REAL failure'); }"],
        ['undefined', 'export const enableCompileCache = undefined;'],
        ['null', 'export const enableCompileCache = null;'],
        ['number', 'export const enableCompileCache = 17;'],
      ] as const;
      for (const [name, source] of presentCases) {
        const present = await run(`controlled-${name}`, 'startup', {
          'controlled.mjs': Str.dedent(`
            ${source}
            export function registerHooks() { throw new Error('Unexpected hook installation'); }
          `),
          'cli.mjs': Str.dedent(`
            import { enableCompileCache } from './controlled.mjs';
            console.info('CALLER entered');
            console.info('REAL result ' + JSON.stringify(enableCompileCache()));
          `),
        }, { module: './controlled.mjs' });
        expect(present.stdout).to.include('PRELOAD present');
        expect(present.stdout).not.to.include('PRELOAD registered');
        expect(present.stdout).to.include('CALLER entered');
        expect(present.stderr).not.to.include('Unexpected hook installation');
        if (name === 'callable') {
          expectSuccess(present);
          expectBefore(present, 'CALLER entered', 'REAL called');
          expect(present.stdout.split('REAL called')).to.have.length(2);
          expect(events(present, 'REAL result ')).to.eql([{ status: 1 }]);
        } else {
          expect(present.code).to.eql(1);
          expect(present.stderr).to.include(
            name === 'throwing'
              ? 'Error: REAL failure'
              : 'TypeError: enableCompileCache is not a function',
          );
        }
      }
      const missingHook = await run('controlled-missing-hook', 'startup', {
        'controlled.mjs': 'export const marker = true;',
        'cli.mjs': "console.info('MAIN entered');",
      }, { module: './controlled.mjs' });
      expect(missingHook.code).to.eql(1);
      expect(missingHook.stderr).to.include('Error: Missing node:module.registerHooks');
      expect(missingHook.stdout).not.to.include('MAIN entered');

      const throwingHook = Str.dedent(`
        import { registerHooks as realRegisterHooks } from 'node:module';
        export function registerHooks() {
          return realRegisterHooks({
            resolve() {
              console.info('HOOK attempted');
              throw new Error('HOOK failure');
            },
          });
        }
      `);
      const hookError = await run('controlled-hook-error', 'startup', {
        'controlled.mjs': throwingHook,
        'cli.mjs': CACHE_CALL,
      }, { module: './controlled.mjs' });
      const hookMasked = await run('controlled-hook-error-existing-export', 'startup', {
        'controlled.mjs': throwingHook,
        'cli.mjs': Str.dedent(`
          import { createRequire } from 'node:module';
          createRequire(import.meta.url);
          console.info('MAIN continued');
        `),
      }, { module: './controlled.mjs' });
      for (const observed of [hookError, hookMasked]) {
        expect(observed.stdout).to.include('PRELOAD registered');
        expect(observed.stdout).to.include('HOOK attempted');
      }
      // Host diagnostic, not the candidate callback: this injected surface discards our resolver.
      // Retain the suppression evidence. Acceptance below concerns reachable candidate boundaries,
      // not a false claim that Deno propagates arbitrary ESM hook exceptions.
      expectMissingExport(hookError);
      expect(hookError.stderr).not.to.include('HOOK failure');
      expectSuccess(hookMasked);
      expect(hookMasked.stdout).to.include('MAIN continued');
    }

    async function proveCandidateFailures() {
      // These injected failures occur at calls the generated adapter actually makes, outside
      // the resolve callback. They must remain fatal rather than silently falling back.
      for (
        const [name, registration, message] of [
          [
            'registration-throws',
            "export function registerHooks() { throw new Error('REGISTER failure'); }",
            'Error: REGISTER failure',
          ],
          [
            'registration-invalid',
            'export const registerHooks = undefined;',
            'TypeError: Module.registerHooks is not a function',
          ],
        ] as const
      ) {
        const failure = await run(name, 'startup', {
          'controlled.mjs': registration,
          'cli.mjs': "console.info('MAIN continued');",
        }, { module: './controlled.mjs' });
        expect(failure.code).to.eql(1);
        expect(failure.stderr).to.include(message);
        expect(failure.stdout).not.to.include('MAIN continued');
      }
      const deregistration = await run('deregistration-throws', 'startup', {
        'controlled.mjs': Str.dedent(`
          export * from 'node:module';
          export { default } from 'node:module';
          import { registerHooks as register } from 'node:module';
          export function registerHooks(hooks) {
            const handle = register(hooks);
            return { deregister() { handle.deregister(); throw new Error('DEREGISTER failure'); } };
          }
        `),
        'cli.mjs': Str.dedent(`
          ${CACHE_CALL}
          console.info('MAIN continued');
        `),
      }, { module: './controlled.mjs' });
      expect(deregistration.code).to.eql(1);
      expect(deregistration.stderr).to.include('Error: DEREGISTER failure');
      expect(deregistration.stdout).not.to.include('MAIN continued');

      for (
        const [facade, message] of [
          ['syntax', 'SyntaxError: Unexpected token'],
          ['evaluation', 'Error: FACADE failure'],
          ['missing-dependency', 'Module not found'],
        ] as const
      ) {
        const failure = await run(`facade-${facade}`, 'startup', {
          'cli.mjs': Str.dedent(`
            ${CACHE_CALL}
            console.info('MAIN continued');
          `),
        }, { facade });
        expect(failure.code).to.eql(1);
        expect(failure.stderr).to.include(message);
        expect(failure.stdout).not.to.include('MAIN continued');
      }
      const unsupported = await run('unsupported-cache-arguments', 'startup', {
        'cli.mjs': Str.dedent(`
          import { enableCompileCache } from 'node:module';
          console.info('CALL attempted');
          enableCompileCache('directory');
          console.info('MAIN continued');
        `),
      });
      expect(unsupported.code).to.eql(1);
      expect(unsupported.stdout).to.include('CALL attempted');
      expect(unsupported.stdout).not.to.include('MAIN continued');
      expect(unsupported.stderr).to.include(
        'TypeError: Only zero-argument enableCompileCache is supported',
      );

      for (
        const [name, operation, message] of [
          ['missing-module', "await import('./absent.mjs');", 'Module not found'],
          ['esm-error', "await import('./throws.mjs');", 'Error: ESM failure'],
          [
            'cjs-error',
            "const { createRequire } = await import('node:module'); createRequire(import.meta.url)('./throws.cjs');",
            'Error: CJS failure',
          ],
        ] as const
      ) {
        for (const mode of ['none', 'startup'] as const) {
          const failure = await run(name, mode, {
            'cli.mjs': Str.dedent(`
              ${mode === 'startup' ? CACHE_CALL : ''}
              console.info('RUNTIME attempted');
              ${operation}
              console.info('MAIN continued');
            `),
            'throws.mjs': "console.info('THROW entered'); throw new Error('ESM failure');",
            'throws.cjs': "console.info('THROW entered'); throw new Error('CJS failure');",
          });
          expect(failure.code).to.eql(1);
          expect(failure.stderr).to.include(message);
          expect(failure.stdout).to.include('RUNTIME attempted');
          expect(failure.stdout).not.to.include('MAIN continued');
          if (name !== 'missing-module') expect(failure.stdout).to.include('THROW entered');
          if (mode === 'startup') {
            expectBefore(failure, 'PRELOAD deregistered', 'RUNTIME attempted');
          }
        }
      }
      for (const mode of ['none', 'startup'] as const) {
        const exit = await run('exit-code', mode, {
          'cli.mjs': Str.dedent(`
            ${mode === 'startup' ? CACHE_CALL : ''}
            console.info('EXIT requested');
            Deno.exit(7);
          `),
        });
        expect(exit.code).to.eql(7);
        expect(exit.stderr).to.eql('');
        expect(exit.stdout).to.include('EXIT requested');
      }
    }

    async function proveIdentityAndAuthority() {
      // Native cwd/argv/permission queries are the runtime contract under test, not FS helpers.
      // Queries neither request permissions nor attempt denied operations. Before-cache queries
      // are synchronous and introduce no imports or task scheduling into the active graph.
      for (const mode of ['none', 'startup'] as const) {
        const observed = await run('identity-authority', mode, {
          'cli.mjs': Str.dedent(`
            ${mode === 'startup' ? "import { enableCompileCache } from 'node:module';" : ''}
            function authority() {
              return [
                { name: 'read', path: new URL('./cli.mjs', import.meta.url) },
                { name: 'read', path: new URL('../', import.meta.url) },
                ...['write', 'env', 'net', 'run', 'ffi', 'import', 'sys'].map(name => ({ name })),
              ].map(descriptor => Deno.permissions.querySync(descriptor).state);
            }
            const before = authority();
            ${mode === 'startup' ? 'enableCompileCache();' : ''}
            const after = authority();
            const { default: process } = await import('node:process');
            console.info('IDENTITY ' + JSON.stringify({
              main: Deno.mainModule, url: import.meta.url, isMain: import.meta.main,
              cwd: process.cwd(), argv: process.argv, args: Deno.args, before, after,
            }));
          `),
        });
        expectSuccess(observed);
        // Outside the allowlist is ungranted ('prompt'); --no-prompt prevents escalation.
        const states = ['granted', 'prompt', ...Array<string>(7).fill('denied')];
        expect(events(observed, 'IDENTITY ')).to.eql([{
          main: url(observed, 'cli.mjs'),
          url: url(observed, 'cli.mjs'),
          isMain: true,
          cwd: observed.root,
          argv: [Deno.execPath(), Fs.join(observed.root, 'cli.mjs'), ...ARGV],
          args: ARGV,
          before: states,
          after: states,
        }]);
      }
    }

    async function proveConcurrentLaunches() {
      const environment = () =>
        ['HOME', 'DENO_DIR', 'TMPDIR', 'TMP', 'TEMP'].map((key) => Deno.env.get(key));
      const before = environment();
      // allSettled waits for both owned captures even if one proof fails; no live child is abandoned.
      const results = await Promise.allSettled(['left', 'right'].map((token) =>
        run(
          `concurrent-${token}`,
          'startup',
          {
            'cli.mjs': Str.dedent(`
            ${CACHE_CALL}
            const start = Date.now();
            await new Promise(resolve => setTimeout(resolve, 250));
            console.info('SPAN ' + JSON.stringify({ start, end: Date.now(), token: ${
              Json.stringify(token)
            } }));
          `),
          },
        )
      ));
      const pair = results.map((result) => {
        if (result.status === 'rejected') throw result.reason;
        expectSuccess(result.value);
        return result.value;
      });
      expect(environment()).to.eql(before);
      const [left, right] = pair;
      expect(left.root).not.to.eql(right.root);
      expect(left.artifacts['preload.mjs']).to.eql(right.artifacts['preload.mjs']);
      expect(left.artifacts['facade.mjs']).to.eql(right.artifacts['facade.mjs']);
      expect(left.artifacts['cli.mjs']).not.to.eql(right.artifacts['cli.mjs']);
      for (const key of ['HOME', 'DENO_DIR', 'TMPDIR', 'TMP', 'TEMP']) {
        expect(left.env[key]).not.to.eql(right.env[key]);
      }
      const spans = pair.map((receipt) => {
        const values = events(receipt, 'SPAN ');
        expect(values).to.have.length(1);
        const span = values[0];
        if (!Is.record(span) || !Is.num(span.start) || !Is.num(span.end)) {
          throw new Error('Missing concurrent child interval');
        }
        expectBefore(receipt, 'PRELOAD deregistered', 'SPAN ');
        return { start: span.start, end: span.end, token: span.token };
      });
      expect(spans.map((span) => span.token)).to.eql(['left', 'right']);
      expect(spans[0].start).to.be.lessThan(spans[1].end);
      expect(spans[1].start).to.be.lessThan(spans[0].end);
    }

    async function proveCheckedWrites() {
      const failures = [];
      for (const blockWrite of ['preload.mjs', 'facade.mjs'] as const) {
        const before = captureAttempts;
        const { result } = await Err.Try.run(() =>
          run('write-collision', 'startup', {
            'cli.mjs': CACHE_CALL,
          }, { blockWrite })
        );
        if (result.ok) throw new Error(`Expected materialization failure: ${blockWrite}`);
        expect(result.error.message).to.match(/Is a directory|is a directory/);
        expect(captureAttempts, 'materialization must finish before any capture attempt').to.eql(
          before,
        );
        failures.push({ artifact: blockWrite, error: Err.std(result.error), captureAttempts: 0 });
      }
      await Fs.write(Fs.join(root, 'materialization.json'), Json.stringify(failures), {
        throw: true,
      });
    }

    /** Every run owns its complete inputs, config, cache, environment, and bounded child. */
    async function run(
      name: string,
      mode: Mode,
      files: Files,
      options: RunOptions = {},
    ): Promise<Receipt> {
      const dir = (await Fs.makeTempDir({ dir: root, prefix: `${name}.${mode}.` })).absolute;
      const generated = preloadSources({
        lifetime: mode === 'startup' ? 'startup' : 'persistent',
        module: options.module,
      });
      const facade = options.facade === 'syntax'
        ? 'export const = ;'
        : options.facade === 'evaluation'
        ? Str.dedent(`${generated.facade}\nthrow new Error('FACADE failure');`)
        : options.facade === 'missing-dependency'
        ? Str.dedent(`${generated.facade}\nexport * from './absent.mjs';`)
        : generated.facade;
      const sources = {
        'mapped.mjs': "export const value = 'local-value';",
        ...files,
        'preload.mjs': generated.preload,
        'facade.mjs': facade,
        'deno.json': Json.stringify({
          workspace: [],
          nodeModulesDir: 'none',
          imports: { 'mapped-local': './mapped.mjs' },
        }),
        'deno.lock': Json.stringify({ version: '5', specifiers: {} }),
      };
      const env = {
        HOME: Fs.join(dir, 'home'),
        DENO_DIR: Fs.join(dir, 'cache'),
        TMPDIR: Fs.join(dir, 'tmp'),
        TMP: Fs.join(dir, 'tmp'),
        TEMP: Fs.join(dir, 'tmp'),
        FORCE_COLOR: '1',
      };
      for (const path of [env.HOME, env.DENO_DIR, env.TMPDIR]) await Fs.ensureDir(path);
      // A real directory/file collision exercises Fs.write failure without a permission bypass.
      if (options.blockWrite) await Fs.ensureDir(Fs.join(dir, options.blockWrite));
      for (const [name, source] of Obj.entries(sources)) {
        await Fs.write(Fs.join(dir, name), source, { throw: true });
      }
      const artifacts: Record<string, string> = {};
      for (const [name, source] of Obj.entries(sources)) {
        const read = await Fs.readText(Fs.join(dir, name));
        expect(read.ok, `materialized ${name}`).to.eql(true);
        expect(read.data).to.eql(source);
        artifacts[name] = Hash.sha256(read.data);
      }
      const args = [
        'run',
        `--config=${Fs.join(dir, 'deno.json')}`,
        `--lock=${Fs.join(dir, 'deno.lock')}`,
        '--frozen',
        '--cached-only',
        '--no-prompt',
        `--allow-read=${dir}`,
        '--deny-write',
        '--deny-env',
        '--deny-net',
        '--deny-run',
        '--deny-ffi',
        '--deny-import',
        '--deny-sys',
        ...(mode === 'none' ? [] : [`--preload=${Fs.join(dir, 'preload.mjs')}`]),
        Path.toFileUrl(Fs.join(dir, 'cli.mjs')).href,
        ...ARGV,
      ];
      captureAttempts++;
      const output = await Process.capture({
        cmd: Deno.execPath(),
        args,
        cwd: dir,
        clearEnv: true,
        env,
        executionTimeout: 120_000,
        maxStdoutBytes: 65_536,
        maxStderrBytes: 262_144,
      });
      const receipt: Receipt = {
        name,
        mode,
        root: dir,
        args,
        env,
        artifacts,
        outcome: output.outcome,
        termination: output.termination,
        code: output.code,
        signal: output.signal,
        stdoutTruncated: output.stdoutTruncated,
        stderrTruncated: output.stderrTruncated,
        raw: output.text,
        stdout: Cli.stripAnsi(output.text.stdout),
        stderr: Cli.stripAnsi(output.text.stderr),
        ...('error' in output ? { error: Err.std(output.error) } : {}),
      };
      receipts.push(receipt);
      await Fs.write(Fs.join(dir, 'receipt.json'), Json.stringify(receipt), { throw: true });
      console.info(`PRELOAD child: ${name} / ${mode} → ${receipt.code} (${dir})`);
      expect(output.outcome, 'natural settlement; retain all files on uncertainty').to.eql(
        'exited',
      );
      expect(output.termination).to.eql({ reason: null, actions: [] });
      expect(output.signal).to.eql(null);
      expect(output.stdoutTruncated, 'complete diagnostics').to.eql(false);
      expect(output.stderrTruncated, 'complete diagnostics').to.eql(false);
      expect(receipt.stderr, 'permission denial stops the investigation').not.to.match(
        /NotCapable|PermissionDenied|Requires .+ access/,
      );
      for (const [name, hash] of Obj.entries(artifacts)) {
        const read = await Fs.readText(Fs.join(dir, name));
        expect(read.ok, `retained ${name} after settlement`).to.eql(true);
        expect(Hash.sha256(read.data)).to.eql(hash);
      }
      return receipt;
    }

    async function verdict(status: 'supported candidate' | 'blocked/inconclusive', limits: string) {
      const result = {
        status,
        limits,
        children: receipts.map((receipt) =>
          Obj.pick(
            receipt,
            'name',
            'mode',
            'root',
            'code',
            'outcome',
            'termination',
            'signal',
            'stdoutTruncated',
            'stderrTruncated',
            'artifacts',
          )
        ),
      };
      await Fs.write(Fs.join(root, 'verdict.json'), Json.stringify(result), { throw: true });
      console.info(`PRELOAD verdict: ${status}. ${limits}`);
    }
  });
});

/** Parse only prefixed child evidence; native JSON is the child wire format. */
function events(receipt: Receipt, prefix: string): readonly unknown[] {
  return receipt.stdout.split('\n').filter((line) => line.startsWith(prefix))
    .map((line) => Json.parse(line.slice(prefix.length)));
}

function url(receipt: Receipt, file: string): string {
  return Path.toFileUrl(Fs.join(receipt.root, file)).href;
}

function expectSuccess(receipt: Receipt) {
  expect(receipt.code, receipt.stderr).to.eql(0);
  expect(receipt.stderr).to.eql('');
}

function expectMissingExport(receipt: Receipt) {
  expect(receipt.code, receipt.stderr).to.eql(1);
  expect(receipt.stderr).to.include(
    "SyntaxError: The requested module 'node:module' does not provide an export named 'enableCompileCache'",
  );
}

function expectBefore(receipt: Receipt, first: string, second: string) {
  const left = receipt.stdout.indexOf(first);
  const right = receipt.stdout.indexOf(second);
  expect(left, first).to.be.greaterThan(-1);
  expect(right, second).to.be.greaterThan(left);
}
