import { describe, expect, it } from '../../-test.ts';
import { Fs, type t } from '../common.ts';
import { PiArgs } from '../u.args.ts';

describe(`@sys/driver-agent/pi/cli/u.args`, () => {
  it('toAgentDir / toDenoDir → derive local runtime directories', () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    expect(PiArgs.toAgentDir(cwd)).to.eql('/tmp/pi-cli-test/.tmp/pi.cli/agent');
    expect(PiArgs.toDenoDir(cwd)).to.eql('/tmp/pi-cli-test/.tmp/pi.cli/deno');
  });

  it('toPiArgs → assembles pi launch args with scoped permissions', async () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    const prevTmp = Deno.env.get('TMPDIR');
    try {
      Deno.env.set('TMPDIR', '/tmp/pi-cli-runtime');
      const args = [...await PiArgs.toPiArgs(cwd, ['--help'])];
      const readArg = findArg(args, '--allow-read=');
      const writeArg = findArg(args, '--allow-write=');
      const sysArg = findArg(args, '--allow-sys=');

      expect(args).to.include('run');
      expect(args).to.include('npm:@mariozechner/pi-coding-agent');
      expect(args).to.include('--help');
      expect(args).to.include(`--allow-ffi=${Fs.join(cwd, '.tmp', 'pi.cli', 'deno')}`);
      expect(readArg).to.contain(cwd);
      expect(readArg).to.contain(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
      expect(readArg).to.contain('/bin/bash');
      expect(writeArg).to.contain(cwd);
      expect(writeArg).to.contain('/tmp/pi-cli-runtime');
      expect(sysArg).to.contain('homedir');
      expect(sysArg).to.contain('osRelease');
      expect(sysArg).to.contain('uid');
    } finally {
      restoreEnv('TMPDIR', prevTmp);
    }
  });
});

function findArg(args: readonly string[], prefix: string) {
  const value = args.find((arg) => arg.startsWith(prefix));
  expect(value).to.be.a('string');
  return value as string;
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    Deno.env.delete(name);
    return;
  }
  Deno.env.set(name, value);
}
