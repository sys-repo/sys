import { describe, expect, it } from '../../../-test.ts';
import { Fs, Process, type t } from '../common.ts';
import { Cli } from '../mod.ts';
import { PI_CODING_AGENT_IMPORT } from '../u.resolve.pkg.ts';

describe(`@sys/driver-agent/pi/cli/m.run`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi/cli');
    expect(m.Cli).to.equal(Cli);
  });

  it('run → writes canonical project-local settings before launch', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.run.test.' }))
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
        expect(findPkgArg(input.args)).to.eql(PI_CODING_AGENT_IMPORT);
        expect(input.args).to.include('--help');
        expect(input.args).to.include(`--allow-ffi=${Fs.join(cwd, '.tmp', 'pi.cli', 'deno')}`);
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        const sysArg = findArg(input.args, '--allow-sys=');
        expect(readArg).to.contain(cwd);
        expect(readArg).to.contain(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
        expect(writeArg).to.contain(cwd);
        expect(sysArg).to.contain('homedir');
        expect(sysArg).to.contain('osRelease');
        expect(sysArg).to.contain('uid');
        expect(input.env).to.eql({
          DENO_DIR: Fs.join(cwd, '.tmp', 'pi.cli', 'deno'),
          PI_CODING_AGENT_DIR: Fs.join(cwd, '.pi', 'agent'),
          PI_SKIP_VERSION_CHECK: '1',
        });
        const read = await Fs.readText(Fs.join(cwd, '.pi', 'settings.json'));
        if (!read.ok) throw read.error;
        expect(JSON.parse(read.data ?? '')).to.eql({
          quietStartup: true,
          collapseChangelog: true,
        });
        return { code: 0, success: true, signal: null };
      };

      const res = await Cli.run({ cwd: { invoked: cwd, git: cwd }, args: ['--help'] });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → launches the child process from the invoked cwd', async () => {
    const prev = Process.inherit;
    const git = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.run.test.' }))
      .absolute as t.StringDir;
    const invoked = Fs.join(git, 'nested', 'cell') as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(git, '.git'));
      await Fs.ensureDir(invoked);
      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(invoked);
        expect(input.env?.DENO_DIR).to.eql(Fs.join(git, '.tmp', 'pi.cli', 'deno'));
        expect(input.env?.PI_CODING_AGENT_DIR).to.eql(Fs.join(git, '.pi', 'agent'));
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        expect(readArg).to.contain(git);
        expect(writeArg).to.contain(git);
        const settings = await Fs.readText(Fs.join(git, '.pi', 'settings.json'));
        expect(settings.ok).to.eql(true);
        return { code: 0, success: true, signal: null };
      };

      const res = await Cli.run({ cwd: { invoked, git } });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(git);
    }
  });

  it('run → passes cwd and env through to the child process', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.run.test.' }))
      .absolute as t.StringDir;
    const env = { PI_FOO: 'bar' };
    try {
      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--no-prompt');
        expect(input.args).not.to.include('--no-config');
        expect(input.args).to.include('--no-lock');
        expect(input.env).to.eql({
          ...env,
          DENO_DIR: Fs.join(cwd, '.tmp', 'pi.cli', 'deno'),
          PI_CODING_AGENT_DIR: Fs.join(cwd, '.pi', 'agent'),
          PI_SKIP_VERSION_CHECK: '1',
        });
        expect(input.args).to.include('run');
        expect(findPkgArg(input.args)).to.eql(PI_CODING_AGENT_IMPORT);
        expect(input.args).to.include(`--allow-ffi=${Fs.join(cwd, '.tmp', 'pi.cli', 'deno')}`);
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        expect(readArg).to.contain(cwd);
        expect(readArg).to.contain(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
        expect(writeArg).to.contain(cwd);
        const read = await Fs.readText(Fs.join(cwd, '.pi', 'settings.json'));
        if (!read.ok) throw read.error;
        expect(JSON.parse(read.data ?? '')).to.eql({
          quietStartup: true,
          collapseChangelog: true,
        });
        return { code: 0, success: true, signal: null };
      };

      await Fs.ensureDir(Fs.join(cwd, '.git'));
      const res = await Cli.run({ cwd: { invoked: cwd, git: cwd }, env });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → passes extra write scope through to the child process', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.run.test.' }))
      .absolute as t.StringDir;
    try {
      Process.inherit = async (input) => {
        const writeArg = findArg(input.args, '--allow-write=');
        expect(writeArg).to.contain(cwd);
        expect(writeArg).to.contain('/tmp/pi-cli-extra-write');
        return { code: 0, success: true, signal: null };
      };

      await Fs.ensureDir(Fs.join(cwd, '.git'));
      const res = await Cli.run({
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
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.run.test.' }))
      .absolute as t.StringDir;
    try {
      Process.inherit = async (input) => {
        expect(input.args).to.include('--allow-all');
        expect(input.args.some((arg) => arg.startsWith('--allow-read='))).to.eql(false);
        expect(input.args.some((arg) => arg.startsWith('--allow-write='))).to.eql(false);
        expect(input.args.some((arg) => arg.startsWith('--allow-ffi='))).to.eql(false);
        return { code: 0, success: true, signal: null };
      };

      await Fs.ensureDir(Fs.join(cwd, '.git'));
      const res = await Cli.run({ cwd: { invoked: cwd, git: cwd }, allowAll: true });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });
});

function findArg(args: readonly string[], prefix: string) {
  const value = args.find((arg) => arg.startsWith(prefix));
  expect(value).to.be.a('string');
  return value as string;
}

function findPkgArg(args: readonly string[]) {
  const value = args.find((arg) => arg.startsWith('npm:@mariozechner/pi-coding-agent'));
  expect(value).to.be.a('string');
  return value as string;
}
