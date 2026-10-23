import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { Cli, Git, Process, Str } from '../common.ts';
import * as u from '../task.probe.jsr.u.ts';

const state = { packageName: '@sys/tmp', version: '0.0.118' };
const statePath = './-scripts/task.probe.jsr.state.json';

describe('scripts/task.probe.jsr', () => {
  it('parses a guarded dry-run with an exact version override', () => {
    const res = u.parseArgs(['--version', '0.0.12'], '/fixtures', state);

    expect(res).to.eql({
      packageName: '@sys/tmp',
      version: '0.0.12',
      publish: false,
      fixtureRoot: '/fixtures',
      statePath,
    });
  });

  it('auto-increments from probe state when no version is specified', () => {
    const res = u.parseArgs([], '/fixtures', state);

    expect(res).to.eql({
      packageName: '@sys/tmp',
      version: '0.0.119',
      publish: false,
      fixtureRoot: '/fixtures',
      statePath,
    });
  });

  it('patch-bumps from an explicit current version', () => {
    const res = u.parseArgs(['--from', '0.0.118'], '/fixtures', state);

    expect(res).to.eql({
      packageName: '@sys/tmp',
      version: '0.0.119',
      publish: false,
      fixtureRoot: '/fixtures',
      statePath,
    });
  });

  it('accepts the deno task argument separator', () => {
    const res = u.parseArgs(['--', '--version', '0.0.12'], '/fixtures', state);

    expect(res).to.eql({
      packageName: '@sys/tmp',
      version: '0.0.12',
      publish: false,
      fixtureRoot: '/fixtures',
      statePath,
    });
  });

  it('prints the plan as its own visual block after deno task prelude', () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      u.printPlan({
        packageName: '@sys/tmp',
        version: '0.0.119',
        publish: false,
        fixtureRoot: '/fixtures',
        statePath,
      });
    } finally {
      console.info = info;
    }

    const output = Cli.stripAnsi(calls.join('\n'));

    const lines = output.split('\n').filter((line) => line.trim().length > 0);

    expect(calls.at(0)).to.eql('');
    expect(Cli.stripAnsi(calls.at(1) ?? '')).to.eql('JSR probe');
    expect(output).to.contain('package   @sys/tmp');
    expect(output).to.contain('version   0.0.119');
    expect(output).to.contain('fixture   /fixtures/sys-tmp-0.0.119');
    expect(output).to.contain('publish   no (dry run)');
    expect(lines.at(-1)?.trimEnd()).to.eql('publish   no (dry run)');
  });

  it('requires an explicit publish flag for irreversible publish', () => {
    const res = u.parseArgs(['--version', '0.0.12', '--publish'], '/fixtures', state);

    expect(res).to.eql({
      packageName: '@sys/tmp',
      version: '0.0.12',
      publish: true,
      fixtureRoot: '/fixtures',
      statePath,
    });
  });

  it('renders probe metadata as aligned table output', () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      u.printProbeResult({
        status: 'OK',
        exact: { status: 200, hasVersion: false, etag: '"aaa"', contentLength: '413' },
        normal: { status: 200, hasVersion: true, etag: '"bbb"', contentLength: '6128' },
        busted: { status: 200, hasVersion: true, etag: '"bbb"', contentLength: '6128' },
        deno: { success: true, text: { stdout: '', stderr: '' } },
      });
    } finally {
      console.info = info;
    }

    const output = Cli.stripAnsi(calls.join('\n'));
    expect(output).to.contain('source   status     hasVersion   etag   length');
    expect(output).to.contain('exact    200        no           aaa    413');
    expect(output).to.contain('normal   200        yes          bbb    6128');
    expect(output).to.contain('busted   200        yes          bbb    6128');
    expect(output).to.contain('deno     resolved');
    expect(output).not.to.contain('cf');
    expect(output).not.to.contain('age');
    expect(output).not.to.contain('"aaa"');
  });

  it('isolates remote deno resolution from the workspace lockfile', async () => {
    const mutable = Process as unknown as { invoke: typeof Process.invoke };
    const invoke = mutable.invoke;
    const fetch = globalThis.fetch;
    const calls: Parameters<typeof Process.invoke>[0][] = [];

    try {
      globalThis.fetch = async () =>
        new Response('{"versions":{"0.0.119":{}}}', {
          status: 200,
          headers: { etag: '"x"', 'content-length': '2' },
        });
      mutable.invoke = async (args) => {
        calls.push(args);
        return {
          code: 0,
          success: true,
          signal: null,
          stdout: new Uint8Array(),
          stderr: new Uint8Array(),
          text: { stdout: '', stderr: '' },
          toString() {
            return '';
          },
        };
      };

      await u.probePublished({
        packageName: '@sys/tmp',
        version: '0.0.119',
        publish: true,
        fixtureRoot: '/fixtures',
        statePath,
      });
    } finally {
      globalThis.fetch = fetch;
      mutable.invoke = invoke;
    }

    expect(calls.length).to.eql(1);
    expect(calls[0].args).to.eql([
      'info',
      '--no-config',
      '--no-lock',
      '--reload',
      'jsr:@sys/tmp@0.0.119',
    ]);
    expect(calls[0].cwd).to.eql(calls[0].env?.DENO_DIR);
  });

  it('reads committed probe state from git HEAD for commit suggestions', async () => {
    const mutable = Git as unknown as { root: typeof Git.root; fileAtRef: typeof Git.fileAtRef };
    const root = mutable.root;
    const fileAtRef = mutable.fileAtRef;
    const calls: string[] = [];

    try {
      mutable.root = async () => ({ ok: true, bin: { git: 'git' }, root: '/repo' });
      mutable.fileAtRef = async (opts) => {
        calls.push(`${opts.ref}:${opts.path}`);
        return {
          ok: true,
          bytes: new Uint8Array(),
          text: '{"packageName":"@sys/tmp","version":"0.0.120"}\n',
        };
      };

      const res = await u.readCommittedProbeState('/repo/-scripts/task.probe.jsr.state.json');
      expect(res).to.eql({ packageName: '@sys/tmp', version: '0.0.120' });
      expect(calls).to.eql(['HEAD:-scripts/task.probe.jsr.state.json']);
    } finally {
      mutable.root = root;
      mutable.fileAtRef = fileAtRef;
    }
  });

  it('prints the state bump commit suggestion as the final publish-path output', () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      u.printStateCommitSuggestion(state, { packageName: '@sys/tmp', version: '0.0.119' }, 'OK');
    } finally {
      console.info = info;
    }

    expect(calls.at(-3)).to.eql(Cli.Fmt.hr('green'));
    expect(calls.at(-2)).to.contain('chore(jsr): advance @sys/tmp probe state 0.0.118 → 0.0.119');
    expect(calls.at(-1)).to.eql('');
  });

  it('prints a caution divider for non-OK publish probe status', () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      u.printStateCommitSuggestion(
        state,
        { packageName: '@sys/tmp', version: '0.0.119' },
        'DIVERGENCE',
      );
    } finally {
      console.info = info;
    }

    expect(calls.at(-3)).to.eql(Cli.Fmt.hr('yellow'));
  });

  it('advances checked-in state after a successful publish consumes a version', async () => {
    const fs = await Testing.dir('probe-jsr-state');
    const path = Fs.join(fs.dir, 'state.json');
    await Fs.writeJson(path, state);

    await u.writeProbeState({ packageName: '@sys/tmp', version: '0.0.119', statePath: path });

    expect(await u.readProbeState(path)).to.eql({ packageName: '@sys/tmp', version: '0.0.119' });
  });

  it('generates an isolated fixture outside the workspace graph', async () => {
    const fs = await Testing.dir('probe-jsr');
    const args = {
      packageName: '@sys/tmp',
      version: '0.0.12',
      publish: false,
      fixtureRoot: fs.dir,
      statePath,
    };

    const dir = await u.generateFixture(args);

    expect(dir).to.eql(u.fixtureDir(args));
    expect(dir.startsWith(fs.dir)).to.eql(true);
    expect(dir).to.contain('/sys-tmp-0.0.12');
    expect(await Fs.exists(Fs.join(dir, 'deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(dir, 'README.md'))).to.eql(true);
    expect(await Fs.exists(Fs.join(dir, 'src/mod.ts'))).to.eql(true);

    const deno = await Fs.readJson<{
      name?: string;
      version?: string;
      license?: string;
      description?: string;
      publish?: { include?: string[] };
    }>(Fs.join(dir, 'deno.json'));
    expect(deno.data?.name).to.eql('@sys/tmp');
    expect(deno.data?.version).to.eql('0.0.12');
    expect(deno.data?.license).to.eql('MIT');
    expect(deno.data?.description).to.eql('Maintainer-only JSR/Deno resolver test probe.');
    expect(deno.data?.publish?.include).to.eql(['README.md', 'src/**/*.ts', 'deno.json']);

    const readme = await Fs.readText(Fs.join(dir, 'README.md'));
    expect(readme.ok).to.eql(true);
    expect(readme.data).to.contain('Maintainer-only test probe');
    expect(readme.data).to.contain('not a provenance-backed `@sys`');
    expect(readme.data).to.contain('do not use it as an application or');
    expect(readme.data).to.contain('deno task probe:jsr:publish');
    expect(readme.data).to.contain('next patch version from checked-in probe state');

    const mod = await Fs.readText(Fs.join(dir, 'src/mod.ts'));
    expect(mod.ok).to.eql(true);
    expect(Str.trimEdgeNewlines(mod.data ?? '')).to.eql(Str.dedent(`
      /**
       * @module
       * Maintainer-only test probe for JSR package metadata and Deno resolver propagation.
       */

      /** Probe package name. */
      export const name = '@sys/tmp';

      /** Probe package version. */
      export const version = '0.0.12';

      /** Stable package@version marker for resolver checks. */
      export const marker = '@sys/tmp@0.0.12';
    `));
  });

  it('rejects invalid inputs', () => {
    expect(() => u.parseArgs(['--version', 'nope'], '/fixtures', state)).to.throw(
      'Invalid --version: nope',
    );
    expect(() => u.parseArgs(['--from', 'nope'], '/fixtures', state)).to.throw(
      'Invalid --from: nope',
    );
    expect(() => u.parseArgs(['--version', '0.0.12', '--from', '0.0.11'], '/fixtures', state))
      .to.throw('--version and --from are mutually exclusive.');
    expect(() => u.parseArgs(['--version', '0.0.12', '--package', '@sys'], '/fixtures', state))
      .to.throw('Invalid --package: @sys');
  });

  it('rejects unexpected arguments', () => {
    expect(() => u.parseArgs(['--version', '0.0.12', 'extra'], '/fixtures', state)).to.throw(
      'Unexpected argument: extra',
    );
    expect(() => u.parseArgs(['--version', '0.0.12', '--bogus'], '/fixtures', state)).to.throw(
      'Unknown option: --bogus',
    );
  });
});
