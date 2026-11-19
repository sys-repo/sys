import { describe, expect, expectError, it } from '../../-test.ts';
import { Fs, Is, Process as ProcessOwner, type t } from '../common.ts';
import { Raw as RawOwner } from '../m.raw/mod.ts';
import { withInherit } from '../u/u.inherit.ts';
import { PI_AGENT_IMPORT } from '../u/u.resolve.pkg.ts';
import { PiArgs } from '../u/u.args.ts';
import { preloadSources, writePreload } from '../u/u.preload.ts';

const Process = { ...ProcessOwner };
const Raw = {
  ...RawOwner,
  run: (input: Parameters<typeof RawOwner.run>[0]) =>
    withInherit(Process.inherit, () => RawOwner.run(input)),
};

describe(`@sys/driver-pi/cli/raw/m.run`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-pi/cli/raw');
    expect(m.Raw).to.equal(RawOwner);
    expect(m.main).to.equal(RawOwner.main);
    expect(m.run).to.equal(RawOwner.run);
  });

  it('run → writes git-rooted agent settings before launch', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('run');
        expect(input.args).to.include('--no-prompt');
        expect(input.args).not.to.include('--no-config');
        expect(input.args).to.include('--no-lock');
        expect(input.args).to.include('--no-context-files');
        expect(findPkgArg(input.args)).to.eql(PI_AGENT_IMPORT);
        expect(input.args).to.include('--help');
        expect(input.args).to.include(`--allow-ffi=${Fs.join(cwd, '.pi', '@sys', 'tmp', 'deno')}`);
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        const sysArg = findArg(input.args, '--allow-sys=');
        expect(readArg).to.contain(cwd);
        expect(readArg).to.contain(Fs.join(cwd, '.pi', '@sys', 'tmp', 'deno'));
        expect(writeArg).to.contain(cwd);
        expect(sysArg).to.contain('homedir');
        expect(sysArg).to.contain('osRelease');
        expect(sysArg).to.contain('uid');
        expect(input.env).to.eql({
          DENO_DIR: Fs.join(cwd, '.pi', '@sys', 'tmp', 'deno'),
          HOME: Fs.join(cwd, '.pi', '@sys', 'tmp', 'home'),
          PI_CODING_AGENT_DIR: Fs.join(cwd, '.pi', 'agent'),
          PI_SKIP_VERSION_CHECK: '1',
        });
        expect(await Fs.exists(Fs.join(cwd, '.pi', '@sys', 'tmp', 'home'))).to.eql(true);
        const read = await Fs.readJson<t.JsonMap>(Fs.join(cwd, '.pi', 'agent', 'settings.json'));
        if (!read.ok) throw read.error;
        expect(read.data).to.eql({
          quietStartup: true,
          collapseChangelog: true,
        });
        const legacy = await Fs.readText(Fs.join(cwd, '.pi', 'settings.json'));
        expect(legacy.exists).to.eql(false);
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.run({ cwd: { invoked: cwd, git: cwd }, args: ['--help'] });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('preload → exact release only; other selections neither materialize nor inject', async () => {
    await using fixture = await preloadFixture();
    const absent = Fs.join(fixture.root, 'absent');
    for (
      const pkg of [
        'npm:@earendil-works/pi-coding-agent@0.85.1',
        'npm:@earendil-works/pi-coding-agent@1.4.1',
        'npm:@earendil-works/pi-coding-agent@^1.4.0',
        'npm:@earendil-works/pi-coding-agent@1.4.0/dist/cli.js',
        'npm:other@1.4.0',
      ]
    ) {
      expect(await writePreload(absent, pkg)).to.eql(undefined);
      expect(await Fs.exists(absent)).to.eql(false);
      await withInherit(({ args }) => {
        expect(args.some((arg) => arg.startsWith('--preload'))).to.eql(false);
        expect(args).to.include(pkg);
        return Promise.resolve({ code: 0, success: true, signal: null });
      }, () => RawOwner.run({ cwd: { invoked: fixture.root, root: fixture.root }, pkg }));
      expect(await preloadDirs(fixture.root)).to.eql([]);
    }
  });

  it('preload → exists until settlement, then cleans success, nonzero and signal exits', async () => {
    await using fixture = await preloadFixture();
    for (
      const status of [
        { code: 0, success: true, signal: null },
        { code: 7, success: false, signal: null },
        { code: 130, success: false, signal: 'SIGINT' as const },
      ]
    ) {
      const entered = Promise.withResolvers<string>();
      const exit = Promise.withResolvers<typeof status>();
      const launch = withInherit(async ({ args }) => {
        try {
          const main = args.indexOf(PI_AGENT_IMPORT);
          const flags = args.slice(0, main).filter((arg) => arg.startsWith('--preload'));
          expect(flags).to.have.length(1);
          const path = flags[0].slice('--preload='.length);
          const dir = Fs.dirname(path);
          expect(Fs.dirname(dir)).to.eql(PiArgs.toTmpDir(fixture.root));
          expect(args[main - 1]).to.eql(`--preload=${path}`);
          expect(args.slice(main + 1)).to.include('--preload=pi-passthrough');
          const sources = preloadSources({ lifetime: 'startup', trace: false });
          expect((await Fs.readText(path)).data).to.eql(sources.preload);
          expect((await Fs.readText(Fs.join(dir, 'facade.mjs'))).data).to.eql(sources.facade);
          expect(sources.preload).not.to.contain('console.info');
          expect(sources.facade).not.to.contain('console.info');
          entered.resolve(dir);
          return await exit.promise;
        } catch (error) {
          entered.reject(error);
          throw error;
        }
      }, () =>
        RawOwner.run({
          cwd: { invoked: fixture.root, root: fixture.root },
          pkg: PI_AGENT_IMPORT,
          args: ['--preload=pi-passthrough'],
        }));
      void launch.catch(entered.reject);
      try {
        const dir = await entered.promise;
        expect(await Fs.exists(dir)).to.eql(true);
        exit.resolve(status);
        expect(await launch).to.equal(status);
        expect(await Fs.exists(dir)).to.eql(false);
        expect(await preloadDirs(fixture.root)).to.eql([]);
      } finally {
        exit.resolve(status);
        await launch.catch(() => {});
      }
    }
  });

  it('preload → checked first/second write failures clean partial artifacts before spawn', async () => {
    await using fixture = await preloadFixture();
    // Inject below Fs.write: its checked-write propagation is part of this proof.
    const write = Deno.writeTextFile;
    for (const failAt of [1, 2]) {
      let writes = 0;
      let launches = 0;
      const failure = new Error(`preload write ${failAt}`);
      Deno.writeTextFile = (path, data, options) => {
        if (Is.string(path) && /pi-preload\.[^/]+\/(facade|preload)\.mjs$/.test(path)) {
          if (++writes === failAt) return Promise.reject(failure);
        }
        return write(path, data, options);
      };
      try {
        const error = await expectError(() =>
          withInherit(() => {
            launches++;
            return Promise.resolve({ code: 0, success: true, signal: null });
          }, () =>
            RawOwner.run({
              cwd: { invoked: fixture.root, root: fixture.root },
              pkg: PI_AGENT_IMPORT,
            }))
        );
        expect(error).to.equal(failure);
        expect(writes).to.eql(failAt);
        expect(launches).to.eql(0);
        expect(await preloadDirs(fixture.root)).to.eql([]);
      } finally {
        Deno.writeTextFile = write;
      }
    }
  });

  it('preload → argument rejection cleans before spawn and preserves the original error', async () => {
    await using fixture = await preloadFixture();
    const owner = PiArgs as { toArgs: typeof PiArgs.toArgs };
    const toArgs = owner.toArgs;
    const failure = new Error('argument construction');
    let launches = 0;
    owner.toArgs = async () => {
      expect(await preloadDirs(fixture.root)).to.have.length(1);
      throw failure;
    };
    try {
      const error = await expectError(() =>
        withInherit(() => {
          launches++;
          return Promise.resolve({ code: 0, success: true, signal: null });
        }, () =>
          RawOwner.run({
            cwd: { invoked: fixture.root, root: fixture.root },
            pkg: PI_AGENT_IMPORT,
          }))
      );
      expect(error).to.equal(failure);
      expect(launches).to.eql(0);
      expect(await preloadDirs(fixture.root)).to.eql([]);
    } finally {
      owner.toArgs = toArgs;
    }
  });

  it('preload → uncertain launch/status rejection retains and reports artifacts', async () => {
    await using fixture = await preloadFixture();
    const info = console.info;
    const messages: unknown[][] = [];
    const failure = new Error('uncertain settlement');
    let dir = '';
    console.info = (...args) => messages.push(args);
    try {
      const error = await expectError(() =>
        withInherit(({ args }) => {
          dir = Fs.dirname(findArg(args, '--preload=').slice('--preload='.length));
          return Promise.reject(failure);
        }, () =>
          RawOwner.run({
            cwd: { invoked: fixture.root, root: fixture.root },
            pkg: PI_AGENT_IMPORT,
          }))
      );
      expect(error).to.equal(failure);
      expect(await Fs.exists(Fs.join(dir, 'preload.mjs'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'facade.mjs'))).to.eql(true);
      expect(messages).to.eql([[`Pi launch/status failed; preload retained at: ${dir}`]]);
    } finally {
      console.info = info;
    }
  });

  it('preload → cleanup failure reports residue without replacing error or exit status', async () => {
    await using fixture = await preloadFixture();
    const remove = Deno.remove;
    const write = Deno.writeTextFile;
    const info = console.info;
    const messages: unknown[][] = [];
    const cleanup = new Error('cleanup failure');
    const materialize = new Error('materialization failure');
    console.info = (...args) => messages.push(args);
    Deno.remove = (path, options) => {
      if (Is.string(path) && Fs.basename(path).startsWith('pi-preload.')) {
        return Promise.reject(cleanup);
      }
      return remove(path, options);
    };
    try {
      const status = { code: 7, success: false, signal: null };
      const result = await withInherit(() => Promise.resolve(status), () =>
        RawOwner.run({
          cwd: { invoked: fixture.root, root: fixture.root },
          pkg: PI_AGENT_IMPORT,
        }));
      expect(result).to.equal(status);
      Deno.writeTextFile = (path, data, options) => {
        if (Is.string(path) && Fs.basename(path) === 'preload.mjs') {
          return Promise.reject(materialize);
        }
        return write(path, data, options);
      };
      expect(await expectError(() => writePreload(PiArgs.toTmpDir(fixture.root), PI_AGENT_IMPORT)))
        .to.equal(materialize);
      const dirs = await preloadDirs(fixture.root);
      expect(dirs).to.have.length(2);
      expect(messages).to.have.length(2);
      for (const dir of dirs) {
        expect(
          messages.some(([message, error]) =>
            message === `Could not remove Pi preload directory: ${dir}` && error === cleanup
          ),
        ).to.eql(true);
      }
    } finally {
      Deno.remove = remove;
      Deno.writeTextFile = write;
      console.info = info;
    }
  });

  it('preload → concurrent launches own distinct directories and independent cleanup', async () => {
    await using fixture = await preloadFixture();
    const status = { code: 0, success: true, signal: null };
    const start = () => {
      const entered = Promise.withResolvers<string>();
      const exit = Promise.withResolvers<typeof status>();
      const launch = withInherit(async ({ args }) => {
        entered.resolve(Fs.dirname(findArg(args, '--preload=').slice('--preload='.length)));
        return await exit.promise;
      }, () =>
        RawOwner.run({
          cwd: { invoked: fixture.root, root: fixture.root },
          pkg: PI_AGENT_IMPORT,
        }));
      void launch.catch(entered.reject);
      return { entered: entered.promise, exit, launch };
    };
    const left = start();
    const right = start();
    try {
      const [a, b] = await Promise.all([left.entered, right.entered]);
      expect(a).not.to.eql(b);
      expect(await Fs.exists(a)).to.eql(true);
      expect(await Fs.exists(b)).to.eql(true);
      left.exit.resolve(status);
      await left.launch;
      expect(await Fs.exists(a)).to.eql(false);
      expect(await Fs.exists(b)).to.eql(true);
      right.exit.resolve(status);
      await right.launch;
      expect(await Fs.exists(b)).to.eql(false);
    } finally {
      left.exit.resolve(status);
      right.exit.resolve(status);
      await Promise.allSettled([left.launch, right.launch]);
    }
  });

  it('run → grants narrow project-trust probes for git-rooted scoped launches', async () => {
    const prev = Process.inherit;
    const fixture = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    const cwd = Fs.join(fixture, 'org', 'repo') as t.StringDir;
    const parent = Fs.dirname(cwd) as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      Process.inherit = (input) => {
        const read = findPathScope(input.args, '--allow-read=');
        expect(read).to.include(Fs.join(parent, '.agents', 'skills'));
        expect(read).not.to.include(Fs.join(parent, '.git'));
        expect(read).not.to.include(parent);
        return Promise.resolve({ code: 0, success: true, signal: null });
      };

      const res = await Raw.run({ cwd: { invoked: cwd, git: cwd } });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(fixture);
    }
  });

  it('run → grants narrow ancestor discovery probes for gitless scoped launches', async () => {
    const prev = Process.inherit;
    const fixture = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    const cwd = Fs.join(fixture, 'org', 'repo') as t.StringDir;
    const parent = Fs.dirname(cwd) as t.StringDir;
    try {
      await Fs.ensureDir(cwd);
      Process.inherit = (input) => {
        const read = findPathScope(input.args, '--allow-read=');
        expect(read).to.include(cwd);
        expect(read).to.include(Fs.join(parent, '.git'));
        expect(read).to.include(Fs.join(parent, '.agents', 'skills'));
        expect(read).not.to.include(parent);
        return Promise.resolve({ code: 0, success: true, signal: null });
      };

      const res = await Raw.run({ cwd: { invoked: cwd, root: cwd } });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(fixture);
    }
  });

  it('run → launches from invoked cwd while settings stay under git-root agent dir', async () => {
    const prev = Process.inherit;
    const git = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    const invoked = Fs.join(git, 'nested', 'cell') as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(git, '.git'));
      await Fs.ensureDir(invoked);
      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(invoked);
        expect(input.env?.DENO_DIR).to.eql(Fs.join(git, '.pi', '@sys', 'tmp', 'deno'));
        expect(input.env?.HOME).to.eql(Fs.join(git, '.pi', '@sys', 'tmp', 'home'));
        expect(input.env?.PI_CODING_AGENT_DIR).to.eql(Fs.join(git, '.pi', 'agent'));
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        expect(readArg).to.contain(git);
        expect(writeArg).to.contain(git);
        const settings = await Fs.readJson<t.JsonMap>(
          Fs.join(git, '.pi', 'agent', 'settings.json'),
        );
        if (!settings.ok) throw settings.error;
        expect(settings.data).to.eql({
          quietStartup: true,
          collapseChangelog: true,
        });
        const invokedSettings = await Fs.readText(Fs.join(invoked, '.pi', 'settings.json'));
        expect(invokedSettings.exists).to.eql(false);
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.run({ cwd: { invoked, git } });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(git);
    }
  });

  it('run → passes cwd and env through to the child process', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    const env = { PI_FOO: 'bar', HOME: '/tmp/user-home' };
    try {
      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--no-prompt');
        expect(input.args).not.to.include('--no-config');
        expect(input.args).to.include('--no-lock');
        expect(input.args).to.include('--no-context-files');
        expect(input.env).to.eql({
          ...env,
          DENO_DIR: Fs.join(cwd, '.pi', '@sys', 'tmp', 'deno'),
          HOME: Fs.join(cwd, '.pi', '@sys', 'tmp', 'home'),
          PI_CODING_AGENT_DIR: Fs.join(cwd, '.pi', 'agent'),
          PI_SKIP_VERSION_CHECK: '1',
        });
        expect(input.args).to.include('run');
        expect(findPkgArg(input.args)).to.eql(PI_AGENT_IMPORT);
        expect(input.args).to.include(`--allow-ffi=${Fs.join(cwd, '.pi', '@sys', 'tmp', 'deno')}`);
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        expect(readArg).to.contain(cwd);
        expect(readArg).to.contain(Fs.join(cwd, '.pi', '@sys', 'tmp', 'deno'));
        expect(writeArg).to.contain(cwd);
        const read = await Fs.readJson<t.JsonMap>(Fs.join(cwd, '.pi', 'agent', 'settings.json'));
        if (!read.ok) throw read.error;
        expect(read.data).to.eql({
          quietStartup: true,
          collapseChangelog: true,
        });
        return { code: 0, success: true, signal: null };
      };

      await Fs.ensureDir(Fs.join(cwd, '.git'));
      const res = await Raw.run({ cwd: { invoked: cwd, git: cwd }, env });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → passes extra write scope through to the child process', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    try {
      Process.inherit = (input) => {
        const writeArg = findArg(input.args, '--allow-write=');
        expect(writeArg).to.contain(cwd);
        expect(writeArg).to.contain('/tmp/pi-cli-extra-write');
        return Promise.resolve({ code: 0, success: true, signal: null });
      };

      await Fs.ensureDir(Fs.join(cwd, '.git'));
      const res = await Raw.run({
        cwd: { invoked: cwd, git: cwd },
        write: ['/tmp/pi-cli-extra-write' as t.StringPath],
      });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → grants full Deno permissions only when explicitly requested', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.run.test.' }))
      .absolute as t.StringDir;
    try {
      Process.inherit = (input) => {
        expect(input.args).to.include('--allow-all');
        expect(input.args.some((arg) => arg.startsWith('--allow-read='))).to.eql(false);
        expect(input.args.some((arg) => arg.startsWith('--allow-write='))).to.eql(false);
        expect(input.args.some((arg) => arg.startsWith('--allow-ffi='))).to.eql(false);
        return Promise.resolve({ code: 0, success: true, signal: null });
      };

      await Fs.ensureDir(Fs.join(cwd, '.git'));
      const res = await Raw.run({ cwd: { invoked: cwd, git: cwd }, allowAll: true });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });
});

async function preloadFixture() {
  const root = (await Fs.makeTempDir({ prefix: 'driver-pi.preload.test.' })).absolute;
  return {
    root,
    async [Symbol.asyncDispose]() {
      await Fs.remove(root);
    },
  };
}

async function preloadDirs(root: string) {
  const dir = PiArgs.toTmpDir(root);
  if (!await Fs.exists(dir)) return [];
  const entries = await Fs.glob(dir).find('pi-preload.*', { includeDirs: true });
  return entries.map((entry) => entry.path);
}

function findArg(args: readonly string[], prefix: string) {
  const value = args.find((arg) => arg.startsWith(prefix));
  expect(value).to.be.a('string');
  return value as string;
}

function findPkgArg(args: readonly string[]) {
  const value = args.find((arg) => arg === PI_AGENT_IMPORT);
  expect(value).to.be.a('string');
  return value as string;
}

function findPathScope(args: readonly string[], prefix: string) {
  return findArg(args, prefix).slice(prefix.length).split(',');
}
