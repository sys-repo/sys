import { describe, expect, Fs, it } from '../../-test.ts';
import { launchModes, startChrome } from '../u.chrome.launch.ts';
import { BROWSER_PROOF_ROOT, browserProofExecutable } from './u.browser.proof.ts';

const executablePath = await browserProofExecutable();

describe('Browser Chrome finite direct-process authority', () => {
  it('selected Chrome granted → representative launchers remain unavailable', async () => {
    const selected = await Deno.permissions.query({ name: 'run', command: executablePath });
    expect(selected.state).to.eql('granted');

    const denied = deniedCommands().filter((item) => item.command !== executablePath);
    for (const item of denied) {
      const permission = await Deno.permissions.query({ name: 'run', command: item.command });
      expect(permission.state === 'granted').to.eql(false);
      await expectNotCapable(item.command, item.args);
    }

    const chromeBin = await Deno.permissions.query({ name: 'env', variable: 'CHROME_BIN' });
    expect(chromeBin.state === 'granted').to.eql(false);
    let envFailure: unknown;
    try {
      Deno.env.get('CHROME_BIN');
    } catch (cause) {
      envFailure = cause;
    }
    expect(envFailure).to.be.instanceOf(Deno.errors.NotCapable);
  });

  it('both launch modes → owned forced cleanup removes each exact profile', async () => {
    for (const mode of launchModes()) {
      const started = await startChrome(executablePath, mode);
      if (!started.ok) console.info(started);
      expect(started.ok).to.eql(true);
      if (!started.ok) throw new Error(`Expected Chrome mode to start: ${mode.name}`);

      const profilePath = started.profilePath;
      expect(profilePath.startsWith(`${BROWSER_PROOF_ROOT}/`)).to.eql(true);
      expect(await Fs.exists(profilePath)).to.eql(true);

      const cleanup = await started.close();
      expect(cleanup).to.eql([]);
      expect(await Fs.exists(profilePath)).to.eql(false);
    }
  });
});

async function expectNotCapable(command: string, args: readonly string[]) {
  let caught: unknown;
  try {
    await new Deno.Command(command, {
      args: [...args],
      stdin: 'null',
      stdout: 'null',
      stderr: 'null',
    }).output();
  } catch (cause) {
    caught = cause;
  }
  expect(caught).to.be.instanceOf(Deno.errors.NotCapable);
}

function deniedCommands() {
  if (Deno.build.os === 'windows') {
    return [
      { command: Deno.execPath(), args: ['--version'] },
      { command: 'C:\\Windows\\System32\\cmd.exe', args: ['/c', 'exit', '0'] },
      { command: 'node.exe', args: ['--version'] },
      { command: 'npm.cmd', args: ['--version'] },
    ] as const;
  }

  return [
    { command: Deno.execPath(), args: ['--version'] },
    { command: '/bin/sh', args: ['-c', 'exit 0'] },
    { command: '/bin/bash', args: ['-c', 'exit 0'] },
    { command: '/usr/bin/env', args: [] },
    { command: '/usr/bin/true', args: [] },
    { command: '/opt/homebrew/bin/node', args: ['--version'] },
    { command: '/usr/local/bin/node', args: ['--version'] },
    { command: '/opt/homebrew/bin/npm', args: ['--version'] },
    { command: '/usr/local/bin/npm', args: ['--version'] },
  ] as const;
}
