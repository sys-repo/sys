import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { c, Cli, Path, pkg } from '../common.ts';
import { PiSandboxFmt } from '../u.fmt.sandbox.ts';

type SandboxInput = Omit<t.PiCli.SandboxSummary, 'permissions'> & {
  readonly permissions?: t.PiCli.PermissionMode;
};

describe(`@sys/driver-pi/cli/u.fmt.sandbox`, () => {
  it('table → renders the shared scoped identity band with bright capabilities and dim provenance', () => {
    const width = 80;
    const raw = PiSandboxFmt.table({
      permissions: 'scoped',
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width });
    const rawLines = lines(raw);
    const text = Cli.stripAnsi(raw);

    expect(rawLines.slice(0, 2)).to.eql(PiSandboxFmt.header('scoped', width - 1));
    expect(rawLines[0]).to.contain(c.bold(c.cyan('sys:pi')));
    expect(rawLines[0]).to.contain(c.dim(c.cyan(':sandbox')));
    expect(rawLines[0]).to.contain(c.cyan('read, write, bash'));
    expect(rawLines[0]).not.to.contain(c.dim(c.cyan('read, write, bash')));
    expect(rawLines[0]).to.contain(c.dim(c.cyan(' · ')));
    expect(rawLines[0]).to.contain(c.dim(c.cyan(pkg.version)));
    expect(rawLines[1]).to.eql(Cli.Fmt.hr(width - 1, 'cyan'));
    expect(rawLines.at(-1)).to.eql(
      c.dim(Cli.Fmt.hr({ width: width - 1, color: 'gray', weight: 'dashed' })),
    );
    expectHeader(lines(text)[0], 'sys:pi:sandbox', width - 1);
  });

  it('table → drops capabilities before version at exact width boundaries', () => {
    const title = 'sys:pi:sandbox';
    const capabilities = 'read, write, bash';
    const separator = ' · ';
    const full = `${title} ${capabilities}${separator}${pkg.version}`;
    const withVersion = `${title} ${pkg.version}`;
    const measure = Cli.Fmt.Text.Width.measure;
    const fullWidth = measure(full);
    const lineAt = (renderWidth: number) => {
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width: renderWidth + 1 });
      return lines(Cli.stripAnsi(raw))[0];
    };

    expect(lineAt(fullWidth)).to.eql(full);
    const versionOnlyGap = ' '.repeat(fullWidth - 1 - measure(title) - measure(pkg.version));
    const versionOnly = `${title}${versionOnlyGap}${pkg.version}`;
    expect(lineAt(fullWidth - 1)).to.eql(versionOnly);
    expect(versionOnly).not.to.contain(separator);
    expect(lineAt(measure(withVersion))).to.eql(withVersion);
    expect(lineAt(measure(withVersion) - 1)).to.eql(title);
  });

  it('table → detailed fallback brightens the git-root marker only when --git-root was explicit', () => {
    const implicit = PiSandboxFmt.table({
      permissions: 'scoped',
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width: 80 });
    const explicit = PiSandboxFmt.table({
      permissions: 'scoped',
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width: 80, gitRootExplicit: true });

    expect(implicit).to.contain(c.dim(c.cyan(' (--git-root)')));
    expect(explicit).to.contain(c.cyan(' (--git-root)'));
    expect(explicit).not.to.contain(c.dim(c.cyan(' (--git-root)')));
  });

  it('table → persisted-report sheet renders only launch essentials', () => {
    const width = 120;
    const input = {
      report: '/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md',
      cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
      read: {
        summary: ['cwd', 'runtime'],
        detail: ['/tmp/pi-cli-test/.pi/@sys/tmp/deno', '/tmp/pi-cli-test/canon'],
      },
      write: {
        summary: ['cwd', 'temp'],
        detail: ['/tmp/pi-cli-test/out'],
      },
      context: {
        include: ['/tmp/pi-cli-test/extra.md'],
      },
    } as const;
    const text = render(input, width);
    const output = lines(text);

    const renderWidth = width - 1;
    expectHeaderFrame(text, renderWidth);
    expect(output.slice(2, -1)).to.have.length(2);
    expect(output[2]).to.match(/^report\s+/);
    expect(output[3]?.trimEnd()).to.match(/^permissions\s+scoped$/);
    expect(text).to.contain('.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md');
    expect(text).to.not.contain('/tmp/pi-cli-test/.pi');
    expect(text).to.not.match(/\ncontext\s+/);
    expect(text).to.not.match(/\nread\s+/);
    expect(text).to.not.contain('write:cwd');
    expectTargetRowsToFit(text, renderWidth, ['report']);
  });

  it('table → terminal report renders an underlined basename linked to the complete file URL', () => {
    const width = 120;
    const path = '/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md';
    const filename = Path.basename(path);
    const raw = PiSandboxFmt.table({
      permissions: 'scoped',
      report: path,
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width, terminal: true });
    const link = Cli.Fmt.hyperlink(c.underline(c.gray(filename)), Path.toFileUrl(path));
    const text = Cli.stripAnsi(raw);

    expect(raw).to.contain(link);
    expect(text).to.contain(filename);
    expect(text).not.to.contain('.pi/@sys/log/@sys.driver-pi');
    expect(text).to.match(/permissions\s+scoped/);
  });

  it('table → terminal report keeps its complete target while fitting a narrow label', () => {
    const width = 36;
    const filename = '1775975797.abc123.sandbox.log.md';
    const path = `/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/${filename}`;
    const raw = PiSandboxFmt.table({
      permissions: 'scoped',
      report: path,
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width, terminal: true });
    const rawReportLine = lines(raw).find((line) => Cli.stripAnsi(line).startsWith('report')) ?? '';
    const reportLine = Cli.stripAnsi(rawReportLine);

    expect(rawReportLine).to.contain(Path.toFileUrl(path).href);
    expect(reportLine).not.to.contain(filename);
    expect(reportLine).to.contain('log.md');
    expect(Cli.Fmt.Text.Width.measure(rawReportLine)).to.eql(
      Cli.Fmt.Text.Width.measure(reportLine),
    );
    expect(Cli.Fmt.Text.Width.measure(reportLine)).to.be.at.most(width - 1);
    for (const line of lines(raw)) {
      expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width - 1);
    }
  });

  it('table → non-terminal full report paths remain gray and byte-complete when they fit', () => {
    const width = 120;
    const path = '/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md';
    const raw = PiSandboxFmt.table({
      permissions: 'scoped',
      report: path,
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width, terminal: false });

    const display = '.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md';
    expect(raw).to.contain(c.gray(display));
    expect(Cli.stripAnsi(raw)).to.contain(display);
    expect(raw).not.to.contain(c.cyan('..'));
  });

  it('table → non-terminal collapsed report path preserves its tail and marker color', () => {
    const width = 52;
    const filename = '1775.audit..abc.sandbox.log.md';
    const path = `/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/${filename}`;
    const raw = PiSandboxFmt.table({
      permissions: 'scoped',
      report: path,
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
    }, { width, terminal: false });
    const text = Cli.stripAnsi(raw);
    const reportLine = lines(text).find((line) => line.startsWith('report')) ?? '';
    const rawReportLine = lines(raw).find((line) => Cli.stripAnsi(line).startsWith('report')) ?? '';

    expect(text).to.contain(filename);
    expect(raw.split(c.cyan('..'))).to.have.length(2);
    expect(Cli.Fmt.Text.Width.measure(reportLine)).to.be.at.most(width - 1);
    expect(Cli.Fmt.Text.Width.measure(rawReportLine)).to.eql(
      Cli.Fmt.Text.Width.measure(reportLine),
    );
  });

  it('table → groups write cwd and temp roots', () => {
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      write: { summary: ['cwd', 'temp'], detail: ['/tmp/pi-cli-runtime'] },
    }, 120);

    expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\/\s+\(--git-root\)/);
    expect(text).to.contain(':tmp');
    expect(text).to.contain('/tmp/pi-cli-runtime/');
  });

  it('table → fits read and context previews within a narrow width budget', () => {
    const width = 52;
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
      read: {
        summary: ['cwd', 'runtime', 'extra'],
        detail: [
          '/tmp/pi-cli-test/.pi/@sys/tmp/deno',
          '/bin/bash',
          '/bin/sh',
          '/bin/zsh',
          '/var/folders/example/T',
          '/Users/phil/.agents/skills',
          '/tmp/pi-cli-test/extra',
        ],
      },
      context: {
        include: [
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
    expectHeaderFrame(text, renderWidth);
    expect(text).to.match(/\+[0-9]+ more/);
    expectTargetRowsToFit(text, renderWidth, ['context', 'read']);
  });

  it('table → renders sibling workspace context paths with a real relative prefix', () => {
    const text = render({
      cwd: { invoked: '/Users/phil/code/org.sys/sys', git: '/Users/phil/code/org.sys/sys' },
      context: {
        include: [
          '/Users/phil/code/org.sys/sys/AGENTS.md',
          '/Users/phil/code/org.sys/sys.canon/AGENTS.md',
        ],
      },
    }, 120);

    expect(text).to.contain('./AGENTS.md');
    expect(text).to.contain('../sys.canon/AGENTS.md');
    expect(text).to.not.match(/context\s+\.\/AGENTS\.md, canon\/AGENTS\.md/);
  });

  it('table → preserves tail identity for truncated preview paths', () => {
    const text = render({
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      context: {
        include: ['/Users/phil/code/org.sys/sys.canon/-canon/protocol.testing.md'],
      },
    }, 36);

    expect(text).to.contain('testing.md');
    expect(text).to.not.contain('/Users/phil/code/org.sys/sys.canon');
    expectTargetRowsToFit(text, 35, ['context']);
  });

  it('table → renders allow-all as the effective read/write posture', () => {
    const input = {
      permissions: 'allow-all' as const,
      cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      read: {
        summary: ['cwd'],
        detail: ['/tmp/pi-cli-test/.pi/@sys/tmp/deno'],
      },
      write: {
        summary: ['cwd'],
        detail: ['/tmp/pi-cli-test/out'],
      },
    };
    const raw = PiSandboxFmt.table(input, { width: 80 });
    const text = Cli.stripAnsi(raw);

    expect(text).to.match(
      new RegExp(`sys:pi:no-sandbox --allow-all\\s+read, write, bash · ${pkg.version}`),
    );
    expect(text).to.match(/permissions\s+allow-all/);
    expect(text).to.match(/read\s+all/);
    expect(text).to.match(/write\s+all/);
    expect(text).not.to.contain('write:cwd');
    expect(lines(raw).slice(0, 2)).to.eql(PiSandboxFmt.header('allow-all', 79));
    expect(lines(raw)[0]).to.contain(c.bold(c.yellow('sys:pi')));
    expect(lines(raw)[0]).to.contain(c.dim(c.yellow(':no-sandbox')));
    expect(lines(raw)[0]).to.contain(c.yellow('read, write, bash'));
    expect(lines(raw)[0]).to.contain(c.dim(c.yellow(' · ')));
    expect(lines(raw)[0]).to.contain(c.dim(c.yellow(pkg.version)));
    expect(lines(raw).at(-1)).to.eql(
      c.dim(Cli.Fmt.hr({ width: 79, color: 'gray', weight: 'dashed' })),
    );
    expectHeader(lines(text)[0], 'sys:pi:no-sandbox', 79);
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
        include: ['/Users/phil/code/org.sys/sys/AGENTS.md'],
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

    expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\/\s+\(--git-root\)/);
    expect(text).to.contain(':tmp');
    expect(text).to.contain('/tmp/pi-cli-runtime/');
    expect(text).to.contain('./out/');
    expect(text).to.contain(':extra');
    expect(text).to.contain('/opt/pi-cli-extra/');
  });
});

function render(input: SandboxInput, width: number) {
  return Cli.stripAnsi(
    PiSandboxFmt.table({ permissions: 'scoped', ...input }, { width, terminal: false }),
  );
}

function expectHeaderFrame(text: string, width: number) {
  const output = lines(text);
  expectHeader(output[0], 'sys:pi:sandbox', width);
  expect(output[1]).to.eql('━'.repeat(width));
  expect(output.at(-1)).to.eql('┄'.repeat(width));
}

function expectHeader(line: string, title: string, width: number) {
  expect(Cli.Fmt.Text.Width.measure(line)).to.eql(width);
  expect(line.startsWith(title)).to.eql(true);
  expect(line.endsWith(`read, write, bash · ${pkg.version}`)).to.eql(true);
}

function expectTargetRowsToFit(text: string, width: number, labels: readonly string[]) {
  for (const line of lines(text)) {
    const trimmed = line.trimStart();
    if (!labels.some((label) => trimmed.startsWith(label))) continue;
    expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
  }
}

function lines(text: string) {
  return text.split('\n');
}
