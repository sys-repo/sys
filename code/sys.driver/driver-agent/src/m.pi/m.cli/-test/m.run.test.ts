import { describe, expect, it } from '../../../-test.ts';
import { Fs, Process, type t } from '../common.ts';
import { PiCli } from '../mod.ts';

describe(`@sys/driver-agent/pi/cli/m.run`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi/cli');
    expect(m.PiCli).to.equal(PiCli);
  });

  it('run → launches pi in inherited stdio with terminal cwd scope', async () => {
    const prev = Process.inherit;
    try {
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(Fs.cwd('terminal'));
        expect(input.args).to.include('run');
        expect(findPkgArg(input.args)).to.match(/^npm:@mariozechner\/pi-coding-agent(?:@.+)?$/);
        expect(input.args).to.include('--help');
        expect(input.args).to.include(`--allow-ffi=${Fs.join(Fs.cwd('terminal'), '.tmp', 'pi.cli', 'deno')}`);
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        const sysArg = findArg(input.args, '--allow-sys=');
        expect(readArg).to.contain(Fs.cwd('terminal'));
        expect(readArg).to.contain(Fs.join(Fs.cwd('terminal'), '.tmp', 'pi.cli', 'deno'));
        expect(writeArg).to.contain(Fs.cwd('terminal'));
        expect(sysArg).to.contain('homedir');
        expect(sysArg).to.contain('osRelease');
        expect(sysArg).to.contain('uid');
        expect(input.env).to.eql({
          DENO_DIR: Fs.join(Fs.cwd('terminal'), '.tmp', 'pi.cli', 'deno'),
          PI_CODING_AGENT_DIR: Fs.join(Fs.cwd('terminal'), '.pi', 'agent'),
        });
        return { code: 0, success: true, signal: null };
      };

      const res = await PiCli.run({ args: ['--help'] });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
    }
  });

  it('run → passes cwd and env through to the child process', async () => {
    const prev = Process.inherit;
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const env = { PI_FOO: 'bar' };
    try {
      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql({
          ...env,
          DENO_DIR: Fs.join(cwd, '.tmp', 'pi.cli', 'deno'),
          PI_CODING_AGENT_DIR: Fs.join(cwd, '.pi', 'agent'),
        });
        expect(input.args).to.include('run');
        expect(findPkgArg(input.args)).to.match(/^npm:@mariozechner\/pi-coding-agent(?:@.+)?$/);
        expect(input.args).to.include(`--allow-ffi=${Fs.join(cwd, '.tmp', 'pi.cli', 'deno')}`);
        const readArg = findArg(input.args, '--allow-read=');
        const writeArg = findArg(input.args, '--allow-write=');
        expect(readArg).to.contain(cwd);
        expect(readArg).to.contain(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
        expect(writeArg).to.contain(cwd);
        return { code: 0, success: true, signal: null };
      };

      const res = await PiCli.run({ cwd, env });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Deno.remove(cwd, { recursive: true });
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
