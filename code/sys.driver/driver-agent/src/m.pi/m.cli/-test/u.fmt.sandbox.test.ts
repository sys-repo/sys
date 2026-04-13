import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../common.ts';
import { PiSandboxFmt } from '../u.fmt.sandbox.ts';

describe(`@sys/driver-agent/pi/cli/u.fmt.sandbox`, () => {
  it('table → renders cwd, scope and context rows', () => {
    const text = Cli.stripAnsi(PiSandboxFmt.table({
      report: '/tmp/pi-cli-test/.log/@sys.driver-agent.pi/1775975797.abc123.sandbox.log.md',
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

    expect(text).to.contain('Sandbox');
    expect(text).to.contain('━');
    expect(text).to.match(/report\s+\/tmp\/pi-cli-test\/\.log\/@sys\.driver-agent\.pi\/1775975797\.abc123\.sandbox\.log\.md/);
    expect(text).to.contain('/tmp/pi-cli-test');
    expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\//);
    expect(text).to.not.contain('AGENTS.md walk-up');
    expect(text).to.not.contain('discovered context');
    expect(text).to.not.contain('extra context');
    expect(text).to.contain('read');
    expect(text).to.contain('context');
    expect(text).to.contain('..');
    const reportIndex = text.indexOf('report');
    const contextIndex = text.indexOf('context');
    const readIndex = text.indexOf('read');
    const writeIndex = text.indexOf('write:cwd');
    expect(contextIndex).to.be.greaterThan(-1);
    expect(contextIndex).to.be.greaterThan(reportIndex);
    expect(readIndex).to.be.greaterThan(contextIndex);
    expect(writeIndex).to.be.greaterThan(readIndex);
  });

  it('table → keeps read and context compact with preview overflow', () => {
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

    expect(text).to.contain('read');
    expect(text).to.contain('/bin/bash');
    expect(text).to.contain('context');
    expect(text).to.contain('..');
    expect(text).not.to.contain('./CLAUDE.md');
    expect(text).to.contain('+5 more');
    expect(text).to.contain('+4 more');
  });

  it('table → spells out all write roots with continuation rows', () => {
    const text = Cli.stripAnsi(PiSandboxFmt.table({
      cwd: '/tmp/pi-cli-test',
      write: {
        summary: ['cwd', 'temp', 'extra'],
        detail: ['/tmp/pi-cli-runtime', '/tmp/pi-cli-test/out', '/opt/pi-cli-extra'],
      },
    }));

    expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\//);
    expect(text).to.contain(':tmp');
    expect(text).to.contain('/tmp/pi-cli-runtime/');
    expect(text).to.contain('./out/');
    expect(text).to.contain(':extra');
    expect(text).to.contain('/opt/pi-cli-extra/');
  });
});
