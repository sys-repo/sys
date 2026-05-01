import { describe, expect, it } from '../../../-test.ts';
import { Fs, Path, type t } from '../common.ts';
import { PiArgs } from '../u.args.ts';

describe(`@sys/driver-pi/pi/cli/u.args`, () => {
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
    expect(PiArgs.parse(['-A', '--model', 'gpt-5.4'])).to.eql({
      help: false,
      allowAll: true,
      _: ['--model', 'gpt-5.4'],
    });
    expect(PiArgs.parse(['--allow-all', '--', '--allow-all'])).to.eql({
      help: false,
      allowAll: true,
      _: ['--allow-all'],
    });
  });

  it('parse → rejects unsupported git root modes', () => {
    expect(() => PiArgs.parse(['--git-root', 'elsewhere'])).to.throw(
      'Unsupported --git-root value: elsewhere. Expected one of: walk-up, cwd',
    );
  });

  it('toAgentDir / toDenoDir / toHomeDir → derive local runtime directories', () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    expect(PiArgs.toAgentDir(cwd)).to.eql('/tmp/pi-cli-test/.pi/agent');
    expect(PiArgs.toDenoDir(cwd)).to.eql('/tmp/pi-cli-test/.tmp/pi.cli/deno');
    expect(PiArgs.toHomeDir(cwd)).to.eql('/tmp/pi-cli-test/.tmp/pi.cli/home');
  });

  it('toArgs → assembles pi launch args with scoped permissions', async () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    const prevTmp = Deno.env.get('TMPDIR');
    const pkg = 'npm:@mariozechner/pi-coding-agent@9.9.9' as t.StringModuleSpecifier;
    try {
      Deno.env.set('TMPDIR', '/tmp/pi-cli-runtime');
      const args = [
        ...await PiArgs.toArgs(cwd, ['--help'], [], ['/tmp/pi-cli-write' as t.StringPath], {
          pkg,
        }),
      ];
      const readArg = findArg(args, '--allow-read=');
      const writeArg = findArg(args, '--allow-write=');
      const sysArg = findArg(args, '--allow-sys=');

      expect(args).to.include('run');
      expect(args).to.include('--no-prompt');
      expect(args).not.to.include('--no-config');
      expect(args).to.include('--no-lock');
      expect(args).to.include('--no-context-files');
      expect(args).to.include(pkg);
      expect(args).to.include('--help');
      expect(args).to.include(`--allow-ffi=${Fs.join(cwd, '.tmp', 'pi.cli', 'deno')}`);
      expect(readArg).to.contain(cwd);
      expect(readArg).to.contain(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
      expect(readArg).to.contain('/bin/bash');
      expect(readArg).not.to.contain(Fs.join(cwd, '.agents', 'skills'));
      expect(readArg).not.to.contain('/tmp/.agents/skills');
      expect(readArg).not.to.contain('/tmp/.git');
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

  it('toArgs → grants full Deno permissions for explicit debug launches', async () => {
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    const args = [...await PiArgs.toArgs(cwd, ['--help'], [], [], { allowAll: true })];

    expect(args).to.include('--allow-all');
    expect(args).not.to.include('--allow-env');
    expect(args).not.to.include('--allow-net');
    expect(args).not.to.include('--allow-run');
    expect(args.some((arg) => arg.startsWith('--allow-read='))).to.eql(false);
    expect(args.some((arg) => arg.startsWith('--allow-write='))).to.eql(false);
    expect(args.some((arg) => arg.startsWith('--allow-ffi='))).to.eql(false);
    expect(args.some((arg) => arg.startsWith('--allow-sys='))).to.eql(false);
  });

  it('toArgs → resolves the Pi package spec from canonical deps when present above cwd', async () => {
    const depsDir = (await Fs.makeTempDir({ prefix: 'driver-pi.args.test.' }))
      .absolute as t.StringDir;
    const cwd = Fs.join(depsDir, 'pkg') as t.StringDir;
    const depsPath = Fs.join(depsDir, 'deps.yaml');
    try {
      await Fs.ensureDir(cwd);
      await Fs.write(
        depsPath,
        `deno.json:\n  - import: npm:@mariozechner/pi-coding-agent@1.2.3\n`,
      );

      const args = [...(await PiArgs.toArgs(cwd, ['--help']))];
      expect(args).not.to.include('--no-config');
      expect(args).to.include('--no-lock');
      expect(args).to.include('--no-context-files');
      expect(args).to.include('npm:@mariozechner/pi-coding-agent@1.2.3');
    } finally {
      await Fs.remove(depsDir);
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
  const probe = await Fs.makeTempDir({ prefix: 'driver-pi.cli.test.' });
  try {
    return Path.dirname(probe.absolute) as t.StringDir;
  } finally {
    await Fs.remove(probe.absolute);
  }
}
