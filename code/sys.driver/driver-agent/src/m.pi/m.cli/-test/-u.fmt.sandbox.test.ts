import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { Cli } from '../common.ts';
import { PiSandboxFmt } from '../u.fmt.sandbox.ts';

describe(`@sys/driver-agent/pi/cli/u.fmt.sandbox`, () => {
  it('table → uses available terminal width and trims report paths to cwd first', () => {
    const width = 120;
    const text = render({
      report: '/tmp/pi-cli-test/.log/@sys.driver-agent.pi/1775975797.abc123.sandbox.log.md',
      cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
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
    }, width);

    const renderWidth = width - 1;
    expect(firstLine(text)).to.eql('━'.repeat(renderWidth));
    expect(text).to.contain('Sandbox');
    expect(text).to.contain('.log/@sys.driver-agent.pi/1775975797.abc123.sandbox.log.md');
    expect(text).to.not.contain('/tmp/pi-cli-test/.log');
    expectTargetRowsToFit(text, renderWidth, ['report', 'context', 'read']);
    expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\/\s+\(git\)/);
  });

  it('table → report row preserves the final filename when ellipsized', () => {
    const width = 52;
    const text = render({
      report: '/tmp/pi-cli-test/.log/@sys.driver-agent.pi/1775975797.abc123.sandbox.log.md',
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, width);

    expect(text).to.contain('sandbox.log.md');
    expect(text).to.contain('..');
    expect(text).to.not.contain('/tmp/pi-cli-test/.log');
    expectTargetRowsToFit(text, width - 1, ['report']);
  });

  it('table → report row keeps path basename color semantics when shortened', () => {
    const raw = PiSandboxFmt.table({
      report: '/tmp/pi-cli-test/.log/@sys.driver-agent.pi/1775975797.abc123.sandbox.log.md',
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width: 52 });

    expect(raw).to.match(/\x1b\[37m1775975797\.abc123\.sandbox\.log\.md/);
  });

  it('table → fits read and context previews within a narrow width budget', () => {
    const width = 52;
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
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
    }, width);

    const renderWidth = width - 1;
    expect(firstLine(text)).to.eql('━'.repeat(renderWidth));
    expect(text).to.match(/\+[0-9]+ more/);
    expect(text).to.contain('..');
    expectTargetRowsToFit(text, renderWidth, ['context', 'read']);
  });

  it('table → preserves tail identity for truncated preview paths', () => {
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      context: {
        agents: 'walk-up',
        detail: ['/Users/phil/code/org.sys/sys.canon/-canon/protocol.testing.md'],
      },
    }, 36);

    expect(text).to.contain('testing.md');
    expect(text).to.not.contain('/Users/phil/code/org.sys/sys.canon');
    expectTargetRowsToFit(text, 35, ['context']);
  });

  it('table → keeps zero and single-item previews free of bogus overflow suffixes', () => {
    const empty = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, 60);
    expect(empty).to.match(/context\s+-/);
    expect(empty).to.match(/read\s+\/tmp\/pi-cli-test/);
    expect(empty).to.not.contain('+0 more');

    const single = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      context: {
        agents: 'walk-up',
        detail: ['/Users/phil/code/org.sys/sys/AGENTS.md'],
      },
    }, 42);
    expect(single).to.contain('AGENTS.md');
    expect(single).to.not.contain('+0 more');
    expectTargetRowsToFit(single, 41, ['context']);
  });

  it('table → gives write rows a width escape hatch on narrow screens', () => {
    const width = 60;
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      write: {
        summary: ['cwd', 'temp', 'extra'],
        detail: [
          '/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T',
          '/Users/phil/code/-people/rowanyeoman-dev/agent-projects',
        ],
      },
    }, width);

    expect(text).to.contain('write:cwd');
    expect(text).to.contain(':tmp');
    expect(text).to.contain(':extra');
    expect(text).to.contain('/T/');
    expect(text).to.contain('agent-projects/');
    expect(text).to.contain('..');
    expectTargetRowsToFit(text, width - 1, ['write:cwd', ':tmp', ':extra']);
  });

  it('table → spells out all write roots with continuation rows', () => {
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      write: {
        summary: ['cwd', 'temp', 'extra'],
        detail: ['/tmp/pi-cli-runtime', '/tmp/pi-cli-test/out', '/opt/pi-cli-extra'],
      },
    }, 120);

    expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\/\s+\(git\)/);
    expect(text).to.contain(':tmp');
    expect(text).to.contain('/tmp/pi-cli-runtime/');
    expect(text).to.contain('./out/');
    expect(text).to.contain(':extra');
    expect(text).to.contain('/opt/pi-cli-extra/');
  });
});

function render(input: t.PiCli.SandboxSummary, width: number) {
  return Cli.stripAnsi(PiSandboxFmt.table(input, { width }));
}

function firstLine(text: string) {
  return lines(text)[0] ?? '';
}

function expectTargetRowsToFit(text: string, width: number, labels: readonly string[]) {
  for (const line of lines(text)) {
    const trimmed = line.trimStart();
    if (!labels.some((label) => trimmed.startsWith(label))) continue;
    expect(line.length).to.be.at.most(width);
  }
}

function lines(text: string) {
  return text.split('\n');
}
