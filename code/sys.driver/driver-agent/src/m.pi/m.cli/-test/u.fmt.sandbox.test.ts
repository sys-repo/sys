import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../common.ts';
import { PiSandboxFmt } from '../u.fmt.sandbox.ts';

describe(`@sys/driver-agent/pi/cli/u.fmt.sandbox`, () => {
  it('table → renders cwd, scope and context rows', () => {
    const text = Cli.stripAnsi(PiSandboxFmt.table({
      cwd: '/tmp/pi-cli-test',
      read: {
        summary: ['cwd', 'runtime', 'context'],
        detail: ['/tmp/pi-cli-test/.tmp/pi.cli/deno', '/tmp/pi-cli-test/canon'],
      },
      write: {
        summary: ['cwd', 'temp'],
        detail: ['/tmp/pi-cli-test/out'],
      },
      context: {
        agents: 'walk-up',
        include: ['/tmp/pi-cli-test/extra.md'],
        detail: ['/tmp/pi-cli-test/AGENTS.md'],
      },
    }));

    expect(text).to.contain('Sandbox:');
    expect(text).to.contain('━');
    expect(text).to.contain('cwd');
    expect(text).to.contain('/tmp/pi-cli-test');
    expect(text).to.contain('cwd +');
    expect(text).to.contain('runtime');
    expect(text).to.contain('context');
    expect(text).to.contain('tmp');
    expect(text).to.match(/cwd\s+.*\ntmp\s+.*\nwrite\s+cwd \+ tmp/s);
    expect(text).not.to.match(/cwd\s*\n/);
    expect(text).to.contain('AGENTS.md walk-up');
    expect(text).to.contain('discovered context');
    expect(text).to.contain('extra context');
    expect(text).to.contain('read+');
    expect(text).to.contain('tmp');
    expect(text).not.to.contain('write+');
    expect(text).to.contain('context+');
    expect(text).to.contain('.tmp/pi.cli/');
    expect(text).to.contain('./AGENTS.md');
    expect(text).to.contain('./extra.md');
  });

  it('table → aligns wrapped detail rows under the value column', () => {
    const text = Cli.stripAnsi(PiSandboxFmt.table({
      cwd: '/tmp/pi-cli-test',
      read: {
        summary: ['cwd', 'runtime', 'context'],
        detail: [
          '/tmp/pi-cli-test/.tmp/pi.cli/deno',
          '/bin/bash',
          '/bin/sh',
          '/bin/zsh',
          '/var/folders/example/T',
          '/Users/phil/.agents/skills',
          '/tmp/pi-cli-test/extra',
        ],
      },
      context: {
        agents: 'walk-up',
        detail: [
          '/tmp/pi-cli-test/AGENTS.md',
          '/Users/phil/code/org.sys/AGENTS.md',
          '/Users/phil/code/org.sys/sys/AGENTS.md',
          '/Users/phil/code/org.sys/sys.canon/-canon/posture.stier.md',
          '/Users/phil/code/org.sys/sys.canon/-canon/posture.tmind.md',
          '/Users/phil/code/org.sys/sys.canon/-canon/protocol.cli.md',
          '/Users/phil/code/org.sys/sys.canon/-canon/protocol.testing.md',
        ],
      },
    }));

    expect(text).to.match(/read\+\s+\.\.?\//);
    expect(text).to.match(/\n\s+\/bin\/bash/);
    expect(text).to.match(/context\+\s+\.\.?\//);
    expect(text).to.match(/\n\s+~\/code\/org\.sys\/AGENTS\.md|\n\s+\/Users\/phil\/code\/org\.sys\/AGENTS\.md/);
    expect(text).not.to.contain('./CLAUDE.md');
  });

  it('table → keeps write+ for non-temp extra write scope', () => {
    const text = Cli.stripAnsi(PiSandboxFmt.table({
      cwd: '/tmp/pi-cli-test',
      write: {
        summary: ['cwd', 'temp', 'extra'],
        detail: ['/tmp/pi-cli-runtime', '/tmp/pi-cli-test/out'],
      },
    }));

    expect(text).to.contain('write+');
    expect(text).not.to.match(/\nt\s+\/tmp/);
  });
});
