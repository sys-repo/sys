import { c, Cli, describe, expect, it, Path, type t } from '../../-test.ts';
import { WorkspaceInfo } from '../mod.ts';

const RUNTIME = { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' } as const;

const PACKAGE_STATS: t.WorkspaceInfo.PackageResult = {
  kind: 'package',
  runtime: RUNTIME,
  selection: { workspace: './deno.json', scope: '@sys' },
  packages: [
    { name: '@sys/a', path: 'code/a' },
    { name: '@sys/b', path: 'code/b' },
    { name: '@sys/c', path: 'code/c' },
  ],
  source: { include: ['**/*.{ts,tsx}'], exclude: [] },
  files: 12,
  lines: 123,
};

const GRAPH: t.WorkspaceInfo.GraphSummary = {
  path: '/tmp/workspace graph/deno.graph.json' as t.StringPath,
  hash: `sha256-${'a'.repeat(59)}e0a7c` as t.StringHash,
  edges: 396,
};

describe(`Workspace.Info.fmt`, () => {
  describe('source projection', () => {
    it('renders raw source policy and line partitions on one metric grid', () => {
      const text = Cli.stripAnsi(WorkspaceInfo.fmt({
        kind: 'glob',
        runtime: RUNTIME,
        source: { include: ['code/**/*.{ts,tsx}'], exclude: [] },
        files: 12,
        lines: 123,
        lineBreakdown: { source: 111, unitTests: 10, uiSpecTests: 2 },
      }));
      const source = lineWith(text, 'pattern.code');
      const files = lineWith(text, 'files');
      const lines = lineWith(text, 'lines');
      const sourceCode = lineWith(text, 'source code');
      const unitTest = lineWith(text, 'unit test');
      const uiHarness = lineWith(text, 'ui harness');
      const valueColumn = columnOf(files, '12');

      expect(lineWith(text, 'Deno.version')).to.contain(RUNTIME.deno);
      expect(lineWith(text, 'typescript')).to.contain(RUNTIME.typescript);
      expect(lineWith(text, 'v8')).to.contain(RUNTIME.v8);
      expect(source).to.contain('code/**/*.{ts,tsx}');
      expect(columnOf(lines, '123')).to.eql(valueColumn);
      expect(columnOf(sourceCode, '├─')).to.eql(valueColumn);
      expect(columnOf(unitTest, '├─')).to.eql(valueColumn);
      expect(columnOf(uiHarness, '└─')).to.eql(valueColumn);
      expect(sourceCode).to.contain('111');
      expect(unitTest).to.contain('10');
      expect(uiHarness).to.contain('2');
    });

    it('renders selected package ownership and every normalized include', () => {
      const text = Cli.stripAnsi(WorkspaceInfo.fmt({
        ...PACKAGE_STATS,
        source: { include: ['**/*.ts', '**/*.tsx'], exclude: [] },
      }));
      const packages = lineWith(text, 'packages');
      const includeTs = lineWith(text, '**/*.ts');
      const includeTsx = lineWith(text, '**/*.tsx');
      const files = lineWith(text, 'files');
      const lines = lineWith(text, 'lines');
      const valueColumn = columnOf(packages, '3');

      expect(packages).to.contain('@sys/*');
      expect(valueColumnAfterLabel(includeTs, 'include')).to.eql(valueColumn);
      expect(columnOf(includeTsx, '**/*.tsx')).to.eql(valueColumn);
      expect(columnOf(files, '12')).to.eql(valueColumn);
      expect(columnOf(lines, '123')).to.eql(valueColumn);
    });
  });

  describe('graph summary', () => {
    it('links graph identity and aligns its edge metric with ownership detail', () => {
      const raw = WorkspaceInfo.fmt(PACKAGE_STATS, { graph: GRAPH, terminal: true, width: 80 });
      const text = Cli.stripAnsi(raw);
      const workspace = lineWith(text, 'Workspace');
      const packages = lineWith(text, 'packages');
      const rawWorkspace = rawLineWith(raw, 'Workspace');

      expect(workspace).to.contain('graph:#e0a7c');
      expect(workspace).to.contain('396 edges');
      expect(columnOf(workspace, 'graph')).to.eql(columnOf(packages, '3'));
      expect(columnOf(workspace, '396 edges')).to.eql(columnOf(packages, '@sys/*'));
      expect(rawWorkspace).to.contain(Path.toFileUrl(GRAPH.path).href);
      expect(rawWorkspace).to.contain(c.underline(c.dim('graph:#e0a7c')));
      expect(rawWorkspace).to.contain(c.dim('396 edges'));
      expect(rawWorkspace).not.to.contain(c.green('#e0a7c'));
      expect(rawWorkspace).not.to.contain(c.cyan('396'));

      const nonTerminal = WorkspaceInfo.fmt(PACKAGE_STATS, {
        graph: GRAPH,
        terminal: false,
        width: 80,
      });
      expect(rawLineWith(nonTerminal, 'Workspace')).not.to.contain(
        Path.toFileUrl(GRAPH.path).href,
      );
    });

    it('drops graph detail by semantic priority under width pressure', () => {
      const withoutSummary = workspaceLine({ width: 40 });
      expect(withoutSummary).to.contain('graph:#e0a7c');
      expect(withoutSummary).not.to.contain('edges');
      expect(Cli.Fmt.Text.Width.measure(withoutSummary)).to.be.at.most(40);

      const withoutHash = workspaceLine({ width: 21 });
      expect(withoutHash).to.contain('graph');
      expect(withoutHash).not.to.contain('#');
      expect(Cli.Fmt.Text.Width.measure(withoutHash)).to.be.at.most(21);

      const titleOnly = workspaceLine({ width: 14 });
      expect(titleOnly).to.contain('Workspace');
      expect(titleOnly).not.to.contain('graph');
      expect(Cli.Fmt.Text.Width.measure(titleOnly)).to.be.at.most(14);
    });
  });

  describe('layout under width pressure', () => {
    it('fits package details without moving labels or metric values', () => {
      const width = 40;
      const text = Cli.stripAnsi(WorkspaceInfo.fmt({
        ...PACKAGE_STATS,
        selection: { workspace: './deno.json', scope: '@a-very-long-package-scope' },
        packages: [{ name: '@a-very-long-package-scope/a', path: 'code/a' }],
        source: { include: ['**/*.ts'], exclude: [] },
        files: 1_000,
        lines: 1_000,
      }, { width }));
      const packages = lineWith(text, 'packages');
      const include = lineWith(text, 'include');
      const files = lineWith(text, 'files');
      const lines = lineWith(text, 'lines');
      const valueColumn = columnOf(packages, '1');

      expect(packages).to.contain('…');
      expect(valueColumnAfterLabel(include, 'include')).to.eql(valueColumn);
      expect(columnOf(files, '1,000')).to.eql(valueColumn);
      expect(columnOf(lines, '1,000')).to.eql(valueColumn);
      expectBounded(text, width);
    });

    it('moves trailing ownership after unusually wide numeric values', () => {
      const width = 60;
      const value = Number.MAX_SAFE_INTEGER;
      const formatted = value.toLocaleString();
      const text = Cli.stripAnsi(WorkspaceInfo.fmt({
        ...PACKAGE_STATS,
        packages: [{ name: '@sys/a', path: 'code/a' }],
        source: { include: ['**/*.ts'], exclude: [] },
        files: value,
        lines: value,
      }, { width }));
      const packages = lineWith(text, 'packages');
      const files = lineWith(text, 'files');
      const valueColumn = columnOf(files, formatted);
      const detailColumn = columnOf(packages, '@sys/*');
      const gap = detailColumn - valueColumn - Cli.Fmt.Text.Width.measure(formatted);

      expect(columnOf(packages, '1')).to.eql(valueColumn);
      expect(gap).to.eql(Cli.Table.cellGap);
      expectBounded(text, width);
    });

    it('clips raw source detail without moving aggregate metrics', () => {
      const width = 40;
      const sourcePattern = 'code/this-is-a-very-long-source-pattern/**/*.ts';
      const text = Cli.stripAnsi(WorkspaceInfo.fmt({
        kind: 'glob',
        runtime: RUNTIME,
        source: { include: [sourcePattern], exclude: [] },
        files: 1_000,
        lines: 1_000,
      }, { width }));
      const source = lineWith(text, 'pattern.code');
      const files = lineWith(text, 'files');
      const lines = lineWith(text, 'lines');
      const valueColumn = columnOf(files, '1,000');

      expect(source).to.contain('…');
      expect(source).not.to.contain(sourcePattern);
      expect(valueColumnAfterLabel(source, 'pattern.code')).to.eql(valueColumn);
      expect(columnOf(lines, '1,000')).to.eql(valueColumn);
      expectBounded(text, width);
    });

    it('renders an empty source policy without inventing line partitions', () => {
      const text = Cli.stripAnsi(WorkspaceInfo.fmt({
        ...PACKAGE_STATS,
        packages: [{ name: '@sys/a', path: 'code/a' }],
        source: { include: [], exclude: [] },
        files: 0,
        lines: undefined,
      }));
      const include = lineWith(text, 'include');
      const branches = text.split('\n').filter((line) => /[├└]─/.test(line));

      expect(include).to.contain('[]');
      expect(branches).to.eql([]);
    });
  });
});

function workspaceLine(options: { readonly width: number }): string {
  const text = WorkspaceInfo.fmt(PACKAGE_STATS, {
    graph: GRAPH,
    terminal: true,
    width: options.width,
  });
  return lineWith(Cli.stripAnsi(text), 'Workspace');
}

function lineWith(text: string, token: string): string {
  const line = text.split('\n').find((candidate) => candidate.includes(token));
  if (line === undefined) throw new Error(`Expected output row containing "${token}"`);
  return line;
}

function rawLineWith(text: string, token: string): string {
  const line = text.split('\n').find((candidate) => Cli.stripAnsi(candidate).includes(token));
  if (line === undefined) throw new Error(`Expected raw output row containing "${token}"`);
  return line;
}

function columnOf(line: string, token: string): number {
  const index = line.indexOf(token);
  if (index < 0) throw new Error(`Expected row token "${token}"`);
  return Cli.Fmt.Text.Width.measure(line.slice(0, index));
}

function valueColumnAfterLabel(line: string, label: string): number {
  const labelStart = line.indexOf(label);
  if (labelStart < 0) throw new Error(`Expected row label "${label}"`);

  const labelEnd = labelStart + label.length;
  const valueOffset = line.slice(labelEnd).search(/\S/);
  if (valueOffset < 0) throw new Error(`Expected value after row label "${label}"`);
  return Cli.Fmt.Text.Width.measure(line.slice(0, labelEnd + valueOffset));
}

function expectBounded(text: string, width: number): void {
  for (const line of text.split('\n')) {
    expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
  }
}
