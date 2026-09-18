import { describe, expect, it } from '../../-test.ts';
import { c, Cli, Path, pkg, Str, type t } from '../common.ts';
import { PiSandboxFmt } from '../u/u.fmt.sandbox.ts';

type SandboxInput = Omit<t.PiCli.SandboxSummary, 'permissions'> & {
  readonly permissions?: t.PiCli.PermissionMode;
};

describe('@sys/driver-pi/cli/u.fmt.sandbox', () => {
  describe('authority claims', () => {
    for (const permissions of ['scoped', 'allow-all'] as const) {
      it(`${permissions} → states confinement limits across surfaces, widths, and ANSI stripping`, () => {
        const sandbox = { permissions, cwd: { invoked: '/tmp/report', root: '/tmp/report' } };
        const report = '/tmp/report/.pi/@sys/log/@sys.driver-pi/1.fixture.sandbox.log.md';
        for (const width of [24, 36, 60, 80, 120]) {
          const surfaces = [
            { name: 'header', raw: PiSandboxFmt.header(permissions, width - 1).join('\n') },
            {
              name: 'detailed sheet',
              raw: PiSandboxFmt.table(sandbox, { width, terminal: false }),
            },
            {
              name: 'report-linked sheet',
              raw: PiSandboxFmt.table({ ...sandbox, report }, { width, terminal: true }),
            },
          ];
          for (const { name, raw } of surfaces) {
            const label = `${name}, width ${width}`;
            const text = Str.replaceAll(Cli.stripAnsi(raw), /\s+/g, ' ').after;
            expect(text, label).to.contain(`Deno permissions ${permissions}`);
            expect(text, label).to.contain('Process sandbox not provided by Pi-Driver');
            expect(text, label).to.contain('Outer sandbox <unknown>');
            expect(text, label).to.contain(
              'Deno path limits do not constrain Bash or its subprocesses.',
            );
            expect(text, label).not.to.contain('no-sandbox');
            expect(text, label).not.to.contain('Observation:');
            expect(Str.count(text, 'Deno permissions'), label).to.eql(1);
            expect(Str.count(text, 'Process sandbox'), label).to.eql(1);
            expect(Str.count(text, 'Outer sandbox'), label).to.eql(1);
            for (const line of lines(raw)) {
              expect(Cli.Fmt.Text.Width.measure(line), label).to.be.at.most(width - 1);
            }
          }
        }
      });
    }

    it('allow-all → all Deno read/write grants with a warning tone', () => {
      const input = {
        permissions: 'allow-all' as const,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        read: { summary: ['cwd'], detail: ['/tmp/pi-cli-test/.pi/@sys/tmp/deno'] },
        write: { summary: ['cwd'], detail: ['/tmp/pi-cli-test/out'] },
      };
      const tools = ['read', 'write', 'bash'];
      const raw = PiSandboxFmt.table(input, { width: 80, tools });
      const text = Cli.stripAnsi(raw);

      expect(text).to.match(/permissions\s+allow-all/);
      expect(text).to.match(/read\s+all/);
      expect(text).to.match(/write\s+all/);
      expect(text).not.to.contain('write:cwd');
      const header = PiSandboxFmt.header('allow-all', 79, tools);
      expect(lines(raw).slice(0, 2)).to.eql(header.slice(0, 2));
      expect(lines(raw)[0]).to.contain(c.bold(c.yellow('sys:pi')));
      expect(text).to.contain('Deno permissions   allow-all');
      expect(lines(raw)[0]).not.to.contain('allow-all');
      expect(lines(raw)[0]).to.contain(c.yellow('read, write, bash'));
      expect(lines(raw)[0]).to.contain(c.dim(c.yellow(' · ')));
      expect(lines(raw)[0]).to.contain(c.dim(c.yellow(pkg.version)));
      expect(lines(raw).at(-1)).to.eql(
        c.dim(Cli.Fmt.hr({ width: 79, color: 'gray', weight: 'dashed' })),
      );
      expectHeader(lines(text)[0], 'sys:pi', 79, tools);
    });
  });

  describe('readable launch sheet', () => {
    for (const stage of ['preview', 'launch-input'] as const) {
      it(`${stage} → complete specimen with settings, not runtime attestation`, () => {
        const launch: t.PiCli.LaunchIdentity = {
          stage,
          resolvedAt: '2001-02-03T04:05:06.000Z',
          upstream: 'unknown',
          upstreamExplicit: false,
          profile: '/tmp/report/profile.yaml',
          system: 'default',
          contributions: [],
        };
        const raw = PiSandboxFmt.table({
          permissions: 'scoped',
          cwd: { invoked: '/tmp/report', root: '/tmp/report' },
          launch,
          report: '/tmp/report/1789453920.18qk5j.sandbox.log.md',
        }, { width: 60, terminal: true });
        const text = Cli.stripAnsi(raw);
        const snapshot = stage === 'preview' ? 'preview settings' : 'launch settings';
        const body = lines(text).slice(2, -1).map((line) => line.trimEnd()).join('\n');

        expect(body).to.eql(Str.dedent(`
          Deno permissions   scoped
          Process sandbox    not provided by Pi-Driver
          Outer sandbox      <unknown>
          Report snapshot    ${snapshot}
          Report             1789453920.18qk5j.sandbox.log.md

          Deno path limits do not constrain Bash or its subprocesses.
        `));
        expect(lines(text)[0]).not.to.contain(':deno-');
        expect(text).not.to.contain('launch-input');
        expect(text).not.to.contain('verified');
      });
    }

    it('unknown enclosure → dim gray, not caution or success', () => {
      const raw = PiSandboxFmt.header('scoped', 79).join('\n');
      const row = lines(raw).find((line) => Cli.stripAnsi(line).startsWith('Outer sandbox')) ?? '';
      expect(Cli.stripAnsi(row).trimEnd()).to.eql('Outer sandbox      <unknown>');
      expect(row).to.contain(c.dim(c.gray('<unknown>')));
      expect(row).not.to.contain(c.yellow('<unknown>'));
      expect(row).not.to.contain(c.green('<unknown>'));
      expect(raw).to.contain(c.yellow('not provided by Pi-Driver'));
      expect(raw).not.to.contain('Report snapshot');
    });
  });

  describe('application and selected-tool identity', () => {
    it('scoped header → bright tool detail and dim package provenance', () => {
      const width = 80;
      const tools = ['read', 'write', 'bash'];
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width, tools });
      const rawLines = lines(raw);
      const text = Cli.stripAnsi(raw);

      const header = PiSandboxFmt.header('scoped', width - 1, tools);
      expect(rawLines.slice(0, 2)).to.eql(header.slice(0, 2));
      expect(rawLines[0]).to.contain(c.bold(c.cyan('sys:pi')));
      expect(rawLines[0]).not.to.contain('scoped');
      expect(rawLines[0]).to.contain(c.cyan('read, write, bash'));
      expect(rawLines[0]).not.to.contain(c.dim(c.cyan('read, write, bash')));
      expect(rawLines[0]).to.contain(c.dim(c.cyan(' · ')));
      expect(rawLines[0]).to.contain(c.dim(c.cyan(pkg.version)));
      expect(rawLines[1]).to.eql(Cli.Fmt.hr(width - 1, 'cyan'));
      expect(rawLines.at(-1)).to.eql(
        c.dim(Cli.Fmt.hr({ width: width - 1, color: 'gray', weight: 'dashed' })),
      );
      expectHeader(lines(text)[0], 'sys:pi', width - 1, tools);
    });

    it('caller-selected tools → no unavailable defaults', () => {
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width: 80, tools: ['read', 'bash'] });
      const header = lines(Cli.stripAnsi(raw))[0] ?? '';

      expect(header).to.contain(`read, bash · ${pkg.version}`);
      expect(header).not.to.contain('write');
    });

    it('empty and unresolved tool selections → distinct identities until detail no longer fits', () => {
      const input = {
        permissions: 'scoped' as const,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      };
      const unresolved = lines(Cli.stripAnsi(PiSandboxFmt.table(input, { width: 80 })))[0] ?? '';
      const empty = lines(Cli.stripAnsi(PiSandboxFmt.table(input, { width: 80, tools: [] })))[0] ??
        '';

      expect(unresolved).to.contain(pkg.version);
      expect(unresolved).not.to.contain('tools:');
      expect(empty).to.contain(`tools:none · ${pkg.version}`);
      expect(empty).not.to.eql(unresolved);

      const full = `sys:pi tools:none · ${pkg.version}`;
      const fullWidth = Cli.Fmt.Text.Width.measure(full);
      const exact = Cli.stripAnsi(PiSandboxFmt.header('scoped', fullWidth, [])[0]);
      const narrow = Cli.stripAnsi(PiSandboxFmt.header('scoped', fullWidth - 1, [])[0]);
      expect(exact).to.eql(full);
      expect(narrow).not.to.contain('tools:');
      expect(narrow).not.to.contain(' · ');
    });

    it('shrinking width → drops tool detail before version at exact boundaries', () => {
      const title = 'sys:pi';
      const tools = ['read', 'write', 'bash'];
      const full = `${title} ${tools.join(', ')} · ${pkg.version}`;
      const withVersion = `${title} ${pkg.version}`;
      const measure = Cli.Fmt.Text.Width.measure;
      const fullWidth = measure(full);
      const lineAt = (renderWidth: number) => {
        const raw = PiSandboxFmt.table({
          permissions: 'scoped',
          cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        }, { width: renderWidth + 1, tools });
        return lines(Cli.stripAnsi(raw))[0];
      };

      expect(lineAt(fullWidth)).to.eql(full);
      const gap = ' '.repeat(fullWidth - 1 - measure(title) - measure(pkg.version));
      expect(lineAt(fullWidth - 1)).to.eql(`${title}${gap}${pkg.version}`);
      expect(lineAt(measure(withVersion))).to.eql(withVersion);
      expect(lineAt(measure(withVersion) - 1)).to.eql(title);
    });
  });

  describe('persisted-report sheets and links', () => {
    it('report-backed sheet → launch essentials instead of duplicated scope details', () => {
      const width = 120;
      const input = {
        report: '/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md',
        cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
        read: {
          summary: ['cwd', 'runtime'],
          detail: ['/tmp/pi-cli-test/.pi/@sys/tmp/deno', '/tmp/pi-cli-test/canon'],
        },
        write: { summary: ['cwd', 'temp'], detail: ['/tmp/pi-cli-test/out'] },
        context: { include: ['/tmp/pi-cli-test/extra.md'] },
      } as const;
      const text = render(input, width);
      const output = lines(text);

      const renderWidth = width - 1;
      expectHeaderFrame(text, renderWidth);
      expect(output.slice(2, 7).map((line) => line.trimEnd())).to.eql(lines(Str.dedent(`
        Deno permissions   scoped
        Process sandbox    not provided by Pi-Driver
        Outer sandbox      <unknown>
        Report snapshot    <unknown>
        Report             .pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md
      `)));
      expect(text).to.contain('.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md');
      expect(text).not.to.contain('/tmp/pi-cli-test/.pi');
      expect(text).not.to.match(/\ncontext\s+/);
      expect(text).not.to.match(/\nread\s+/);
      expect(text).not.to.contain('write:cwd');
      expectTargetRowsToFit(text, renderWidth, ['Report']);
    });

    it('terminal → underlined basename linked to the complete file URL', () => {
      const width = 120;
      const path = '/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md';
      const filename = Path.basename(path);
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        report: path,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width, terminal: true });
      const link = Cli.Fmt.hyperlink(c.gray(filename), Path.toFileUrl(path), { underline: true });
      const text = Cli.stripAnsi(raw);

      expect(raw).to.contain(link);
      expect(text).to.contain(filename);
      expect(text).not.to.contain('.pi/@sys/log/@sys.driver-pi');
      expect(text).to.match(/permissions\s+scoped/);
    });

    it('narrow terminal → clipped label retains the complete link target', () => {
      const width = 36;
      const filename = '1775975797.abc123.sandbox.log.md';
      const path = `/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/${filename}`;
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        report: path,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width, terminal: true });
      const rawReportLine = lines(raw).find((line) => /^Report\s{2,}/.test(Cli.stripAnsi(line))) ??
        '';
      const reportLine = Cli.stripAnsi(rawReportLine);

      expect(rawReportLine).to.contain(Path.toFileUrl(path).href);
      expect(reportLine).not.to.contain(filename);
      expect(reportLine).to.contain('log.md');
      expect(Cli.Fmt.Text.Width.measure(rawReportLine)).to.eql(
        Cli.Fmt.Text.Width.measure(reportLine),
      );
      for (const line of lines(raw)) {
        expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width - 1);
      }
    });

    it('non-terminal → full report path stays gray and byte-complete when it fits', () => {
      const path = '/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md';
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        report: path,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width: 120, terminal: false });

      const display = '.pi/@sys/log/@sys.driver-pi/1775975797.abc123.sandbox.log.md';
      expect(raw).to.contain(c.gray(display));
      expect(Cli.stripAnsi(raw)).to.contain(display);
      expect(raw).not.to.contain(c.cyan('..'));
    });

    it('narrow non-terminal → collapsed path retains its tail and omission-marker color', () => {
      const width = 57;
      const filename = '1775.audit..abc.sandbox.log.md';
      const path = `/tmp/pi-cli-test/.pi/@sys/log/@sys.driver-pi/${filename}`;
      const raw = PiSandboxFmt.table({
        permissions: 'scoped',
        report: path,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, { width, terminal: false });
      const text = Cli.stripAnsi(raw);
      const reportLine = lines(text).find((line) => /^Report\s{2,}/.test(line)) ?? '';
      const rawReportLine = lines(raw).find((line) => /^Report\s{2,}/.test(Cli.stripAnsi(line))) ??
        '';

      expect(text).to.contain(filename);
      expect(raw.split(Cli.Fmt.omission('..'))).to.have.length(2);
      expect(raw).not.to.contain(c.cyan('..'));
      expect(Cli.Fmt.Text.Width.measure(reportLine)).to.be.at.most(width - 1);
      expect(Cli.Fmt.Text.Width.measure(rawReportLine)).to.eql(
        Cli.Fmt.Text.Width.measure(reportLine),
      );
    });
  });

  describe('capability previews', () => {
    it('explicit --git-root → brightens only the explicit root marker', () => {
      const input = {
        permissions: 'scoped' as const,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      };
      const implicit = PiSandboxFmt.table(input, { width: 80 });
      const explicit = PiSandboxFmt.table(input, { width: 80, gitRootExplicit: true });

      expect(implicit).to.contain(c.dim(c.cyan(' (--git-root)')));
      expect(explicit).to.contain(c.cyan(' (--git-root)'));
      expect(explicit).not.to.contain(c.dim(c.cyan(' (--git-root)')));
    });

    it('write scope → groups cwd and temporary roots', () => {
      const text = render({
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        write: { summary: ['cwd', 'temp'], detail: ['/tmp/pi-cli-runtime'] },
      }, 120);

      expect(text).to.match(/write:cwd\s+\/tmp\/pi-cli-test\/\s+\(--git-root\)/);
      expect(text).to.contain(':tmp');
      expect(text).to.contain('/tmp/pi-cli-runtime/');
    });

    it('narrow width → read and context lists fit with explicit omission counts', () => {
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
            '/sample/skills',
            '/tmp/pi-cli-test/extra',
          ],
        },
        context: {
          include: [
            '/tmp/pi-cli-test/AGENTS.md',
            '/sample/organization/AGENTS.md',
            '/sample/organization/workspace/AGENTS.md',
            '/sample/organization/workspace.canon/-canon/posture.stier.md',
            '/sample/organization/workspace.canon/-canon/posture.tmind.md',
            '/sample/organization/workspace.canon/-canon/protocol.cli.md',
            '/sample/organization/workspace.canon/-canon/protocol.testing.md',
          ],
        },
      }, width);

      const renderWidth = width - 1;
      expectHeaderFrame(text, renderWidth);
      expect(text).to.match(/\+[0-9]+ more/);
      expectTargetRowsToFit(text, renderWidth, ['context', 'read']);
    });

    it('sibling context → retains the real relative-path prefix', () => {
      const text = render({
        cwd: { invoked: '/sample/organization/workspace', git: '/sample/organization/workspace' },
        context: {
          include: [
            '/sample/organization/workspace/AGENTS.md',
            '/sample/organization/workspace.canon/AGENTS.md',
          ],
        },
      }, 120);

      expect(text).to.contain('./AGENTS.md');
      expect(text).to.contain('../workspace.canon/AGENTS.md');
      expect(text).not.to.match(/context\s+\.\/AGENTS\.md, canon\/AGENTS\.md/);
    });

    it('truncated context path → retains tail identity and the omission marker', () => {
      const input = {
        permissions: 'scoped' as const,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        context: { include: ['/sample/organization/workspace.canon/-canon/protocol.testing.md'] },
      };
      const raw = PiSandboxFmt.table(input, { width: 36, terminal: false });
      const text = Cli.stripAnsi(raw);

      expect(text).to.contain('testing.md');
      expect(raw).to.contain(Cli.Fmt.omission('..'));
      expect(text).not.to.contain('/sample/organization/workspace.canon');
      expectTargetRowsToFit(text, 35, ['context']);
    });

    it('zero or one context entry → no bogus overflow suffix', () => {
      const empty = render({
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
      }, 60);
      expect(empty).to.match(/context\s+-/);
      expect(empty).to.match(/read\s+\/tmp\/pi-cli-test/);
      expect(empty).not.to.contain('+0 more');

      const single = render({
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        context: { include: ['/sample/organization/workspace/AGENTS.md'] },
      }, 42);
      expect(single).to.contain('AGENTS.md');
      expect(single).not.to.contain('+0 more');
      expectTargetRowsToFit(single, 41, ['context']);
    });

    it('narrow write rows → retain root identity within the width budget', () => {
      const width = 60;
      const input = {
        permissions: 'scoped' as const,
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        write: {
          summary: ['cwd', 'temp', 'extra'],
          detail: [
            '/var/folders/example/T',
            '/sample/with/a/very/long/path/to/contributors/rowan/agent-projects',
          ],
        },
      };
      const raw = PiSandboxFmt.table(input, { width, terminal: false });
      const text = Cli.stripAnsi(raw);

      expect(text).to.contain('/T/');
      expect(text).to.contain('agent-projects/');
      expect(raw).to.contain(Cli.Fmt.omission('..'));
      expectTargetRowsToFit(text, width - 1, ['write:cwd', ':tmp', ':extra']);
    });

    it('multiple write roots → every root remains visible in continuation rows', () => {
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
});

function render(input: SandboxInput, width: number) {
  return Cli.stripAnsi(
    PiSandboxFmt.table({ permissions: 'scoped', ...input }, { width, terminal: false }),
  );
}

function expectHeaderFrame(text: string, width: number) {
  const output = lines(text);
  expectHeader(output[0], 'sys:pi', width);
  expect(output[1]).to.eql('━'.repeat(width));
  expect(output.at(-1)).to.eql('┄'.repeat(width));
}

function expectHeader(line: string, title: string, width: number, tools?: string[]) {
  expect(Cli.Fmt.Text.Width.measure(line)).to.eql(width);
  expect(line.startsWith(title)).to.eql(true);
  const detail = tools?.length === 0 ? 'tools:none' : tools?.join(', ');
  expect(line.endsWith(detail ? `${detail} · ${pkg.version}` : pkg.version)).to.eql(true);
}

/** Missing rows must fail before their width can be considered correct. */
function expectTargetRowsToFit(text: string, width: number, labels: readonly string[]) {
  for (const label of labels) {
    const matches = lines(text).filter((line) => line.trimStart().startsWith(label));
    expect(matches.length, `visible ${label} row`).to.be.greaterThan(0);
    for (const line of matches) {
      expect(Cli.Fmt.Text.Width.measure(line), `${label} width`).to.be.at.most(width);
    }
  }
}

function lines(text: string) {
  return text.split('\n');
}
