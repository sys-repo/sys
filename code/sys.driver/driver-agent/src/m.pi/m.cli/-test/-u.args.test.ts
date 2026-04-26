import { describe, expect, it } from '../../../-test.ts';
import { Fs, Path, type t } from '../common.ts';
import { PiArgs } from '../u.args.ts';

describe(`@sys/driver-agent/pi/cli/u.args`, () => {
  it('parse → recognizes wrapper help and preserves passthrough argv otherwise', () => {
    expect(PiArgs.parse(['-h'])).to.eql({ help: true, _: [] });
    expect(PiArgs.parse(['--model', 'gpt-5.4'])).to.eql({
      help: false,
      _: ['--model', 'gpt-5.4'],
    });
    expect(PiArgs.parse(['--git-root', 'cwd', '--', '--model', 'gpt-5.4'])).to.eql({
      help: false,
      gitRoot: 'cwd',
      _: ['--model', 'gpt-5.4'],
    });
    expect(PiArgs.parse(['--git-root=cwd', '--model', 'gpt-5.4'])).to.eql({
      help: false,
      gitRoot: 'cwd',
      _: ['--model', 'gpt-5.4'],
    });
  });

  it('parse → rejects unsupported git root modes', () => {
    expect(() => PiArgs.parse(['--git-root', 'elsewhere'])).to.throw(
      'Unsupported --git-root value: elsewhere. Expected one of: walk-up, cwd',
    );
  });

  it('toAgentDir / toDenoDir → derive local runtime directories', () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    expect(PiArgs.toAgentDir(cwd)).to.eql('/tmp/pi-cli-test/.pi/agent');
    expect(PiArgs.toDenoDir(cwd)).to.eql('/tmp/pi-cli-test/.tmp/pi.cli/deno');
  });

  it('toArgs → assembles pi launch args with scoped permissions', async () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    const prevTmp = Deno.env.get('TMPDIR');
    const pkg = 'npm:@mariozechner/pi-coding-agent@9.9.9' as t.StringModuleSpecifier;
    try {
      Deno.env.set('TMPDIR', '/tmp/pi-cli-runtime');
      const args = [
        ...await PiArgs.toArgs(cwd, ['--help'], [], ['/tmp/pi-cli-write' as t.StringPath], pkg),
      ];
      const readArg = findArg(args, '--allow-read=');
      const writeArg = findArg(args, '--allow-write=');
      const sysArg = findArg(args, '--allow-sys=');

      expect(args).to.include('run');
      expect(args).to.include('--no-prompt');
      expect(args).not.to.include('--no-config');
      expect(args).to.include('--no-lock');
      expect(args).to.include(pkg);
      expect(args).to.include('--help');
      expect(args).to.include(`--allow-ffi=${Fs.join(cwd, '.tmp', 'pi.cli', 'deno')}`);
      expect(readArg).to.contain(cwd);
      expect(readArg).to.contain(Fs.join(cwd, '.agents', 'skills'));
      expect(readArg).to.contain(Fs.join(cwd, '.git'));
      expect(readArg).to.contain(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
      expect(readArg).to.contain('/tmp/.agents/skills');
      expect(readArg).to.contain('/tmp/.git');
      expect(readArg).to.contain('/bin/bash');
      expect(writeArg).to.contain(cwd);
      expect(writeArg).to.contain('/tmp/pi-cli-write');
      expect(writeArg).to.contain('/tmp/pi-cli-runtime');
      expect(sysArg).to.contain('homedir');
      expect(sysArg).to.contain('osRelease');
      expect(sysArg).to.contain('uid');
    } finally {
      restoreEnv('TMPDIR', prevTmp);
    }
  });

  it('toArgs → resolves the Pi package spec from canonical deps when present above cwd', async () => {
    const depsDir = await Deno.makeTempDir();
    const cwd = Fs.join(depsDir, 'pkg') as t.StringDir;
    const depsPath = Fs.join(depsDir, 'deps.yaml');
    try {
      await Deno.mkdir(cwd, { recursive: true });
      await Deno.writeTextFile(
        depsPath,
        `deno.json:\n  - import: npm:@mariozechner/pi-coding-agent@1.2.3\n`,
      );

      const args = [...(await PiArgs.toArgs(cwd, ['--help']))];
      expect(args).not.to.include('--no-config');
      expect(args).to.include('--no-lock');
      expect(args).to.include('npm:@mariozechner/pi-coding-agent@1.2.3');
    } finally {
      await Deno.remove(depsDir, { recursive: true });
    }
  });

  it('toArgs → falls back to the platform tmp dir when temp env vars are absent', async () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    const prevTmpDir = Deno.env.get('TMPDIR');
    const prevTmp = Deno.env.get('TMP');
    const prevTemp = Deno.env.get('TEMP');
    try {
      restoreEnv('TMPDIR', undefined);
      restoreEnv('TMP', undefined);
      restoreEnv('TEMP', undefined);

      const args = [...await PiArgs.toArgs(cwd, ['--help'])];
      expect(args).not.to.include('--no-config');
      expect(args).to.include('--no-lock');
      const readArg = findArg(args, '--allow-read=');
      const writeArg = findArg(args, '--allow-write=');
      const tmpDir = await toPlatformTmpDir();

      expect(readArg).to.contain(tmpDir);
      expect(writeArg).to.contain(tmpDir);
    } finally {
      restoreEnv('TMPDIR', prevTmpDir);
      restoreEnv('TMP', prevTmp);
      restoreEnv('TEMP', prevTemp);
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

async function toPlatformTmpDir() {
  const probe = await Fs.makeTempDir({ prefix: 'driver-agent.pi.cli.test.' });
  try {
    return Path.dirname(probe.absolute) as t.StringDir;
  } finally {
    await Fs.remove(probe.absolute);
  }
}
