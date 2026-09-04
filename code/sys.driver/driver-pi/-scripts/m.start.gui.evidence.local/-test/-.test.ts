import { describe, Err, expect, it } from '../../common.ts';
import { pkg } from '../../../src/pkg.ts';
import { START_GUI_RELEASE_EVIDENCE } from '../../../src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts';
import { START_GUI_SERVICE } from '../../../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';
import { c, Fmt, Pkg, stripAnsi } from '../common.ts';
import { EVIDENCE, renderEvidence, renderEvidenceBoundOutput, writeEvidenceWith } from '../mod.ts';

const EVIDENCE_LEAF = new URL(
  '../../../src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts',
  import.meta.url,
);

const render = (expectedPkg: unknown) =>
  renderEvidence({
    manifestUrl: START_GUI_RELEASE_EVIDENCE.manifestUrl,
    integrity: START_GUI_RELEASE_EVIDENCE.integrity,
    expectedPkg,
  });

describe('driver-pi/scripts/m.start.gui.evidence.local', () => {
  it('binds one frozen generated candidate without coupling its version to current source', () => {
    expect(START_GUI_SERVICE.source).to.equal(START_GUI_RELEASE_EVIDENCE);
    expect(START_GUI_RELEASE_EVIDENCE.manifestUrl).to.eql(
      'http://localhost:8080/dist.json',
    );
    expect(START_GUI_RELEASE_EVIDENCE.expectedPkg.name).to.eql(pkg.name);
    expect(Object.isFrozen(START_GUI_RELEASE_EVIDENCE)).to.eql(true);
    expect(Object.isFrozen(START_GUI_RELEASE_EVIDENCE.expectedPkg)).to.eql(true);
  });

  it('renders the checked-in evidence leaf byte-for-byte', async () => {
    const rendered = new TextEncoder().encode(renderEvidence(START_GUI_RELEASE_EVIDENCE));
    expect(await Deno.readFile(EVIDENCE_LEAF)).to.eql(rendered);
  });

  it('renders semantic settlement through canonical formatters', () => {
    const width = 120;
    const rawLines = renderEvidenceBoundOutput(START_GUI_RELEASE_EVIDENCE, {
      terminal: false,
      width,
    }).split('\n');
    const lines = rawLines.map(stripAnsi);
    const ruleIndex = lines.findIndex(isRule);
    expect(ruleIndex).to.be.greaterThan(0);
    expect(rawLines[ruleIndex]).to.eql(Fmt.hr({ width, color: 'cyan' }));

    const tableLines = lines.slice(0, ruleIndex);
    const rootFacts = [
      ['package', EVIDENCE.packageName],
      ['evidence', EVIDENCE.kind],
      ['state', EVIDENCE.state],
      ['output', EVIDENCE.outputPath],
    ] as const;

    expect(Object.isFrozen(EVIDENCE)).to.eql(true);
    expect(EVIDENCE.packageName).to.eql(pkg.name);
    for (let index = 0; index < rootFacts.length; index += 1) {
      const [label, value] = rootFacts[index];
      const line = tableLines[index] ?? '';
      expect(line).to.contain(label);
      expect(line).not.to.contain(`${label}:`);
      expect(line).to.contain(value);
    }

    expect(rawLines[1] ?? '').to.contain(c.magenta(EVIDENCE.kind));
    expect(rawLines[2] ?? '').to.contain(c.green(EVIDENCE.state));
    expect(rawLines[3] ?? '').to.contain(
      Fmt.Path.str(EVIDENCE.outputPath, { relative: 'bare' }),
    );

    const manifestIndex = uniqueLineIndex(tableLines, START_GUI_RELEASE_EVIDENCE.manifestUrl);
    const integrityIndex = uniqueLineIndex(tableLines, START_GUI_RELEASE_EVIDENCE.integrity);
    const expectsIndex = uniqueLineIndex(
      tableLines,
      Pkg.toString(START_GUI_RELEASE_EVIDENCE.expectedPkg),
    );
    expect(rawLines[manifestIndex] ?? '').to.contain(c.gray(Fmt.Tree.branch(false)));
    expect(rawLines[integrityIndex] ?? '').to.contain(c.gray(Fmt.Tree.branch(false)));
    expect(rawLines[expectsIndex] ?? '').to.contain(c.gray(Fmt.Tree.branch(true)));

    uniqueLineIndex(lines.slice(ruleIndex + 1), EVIDENCE.commitMessage);
  });

  it('fits bound state and output rows to narrow terminals', () => {
    const width = 40;
    const lines = renderEvidenceBoundOutput(START_GUI_RELEASE_EVIDENCE, {
      terminal: true,
      width,
    }).split('\n');
    const ruleIndex = lines.findIndex((line) => isRule(stripAnsi(line)));
    expect(ruleIndex).to.be.greaterThan(0);
    for (const line of lines.slice(0, ruleIndex)) {
      if (stripAnsi(line).trim()) expect(Fmt.Text.Width.measure(line)).to.be.at.most(width);
    }
    expect(Fmt.Text.Width.measure(lines[ruleIndex] ?? '')).to.eql(width);
  });

  it('escapes admitted package strings as valid single-quoted TypeScript', () => {
    const source = render({
      name: "@sys/driver-'pi\\fixture",
      version: "0.0.0+'proof\\fixture",
    });
    expect(source).to.contain(`name: '@sys/driver-\\'pi\\\\fixture'`);
    expect(source).to.contain(`version: '0.0.0+\\'proof\\\\fixture'`);
  });

  it('rejects malformed package identity before rendering authority', () => {
    for (
      const value of [
        undefined,
        {},
        { name: '', version: '0.0.0' },
        { name: '@sys/driver-pi', version: '' },
        { name: '@sys/driver-pi', version: '0.0.0\nchanged' },
      ]
    ) {
      expect(() => render(value)).to.throw(
        'Driver Pi local GUI evidence package identity is invalid.',
      );
    }
  });

  it('rejects malformed URL and integrity authority before rendering', () => {
    expect(() =>
      renderEvidence({
        ...START_GUI_RELEASE_EVIDENCE,
        manifestUrl: 'http://localhost:8080/dist.json?mutable',
      })
    ).to.throw('Driver Pi local GUI evidence manifest URL is invalid.');
    expect(() =>
      renderEvidence({
        ...START_GUI_RELEASE_EVIDENCE,
        integrity: `${START_GUI_RELEASE_EVIDENCE.integrity}:size=1`,
      })
    ).to.throw('Driver Pi local GUI evidence integrity is invalid.');
  });

  it('fails closed when the evidence output write rejects', async () => {
    const reported = Err.std('denied');
    let thrown: unknown;
    try {
      await writeEvidenceWith('candidate', {
        writeTextFile: () => Promise.reject(reported),
      });
    } catch (cause) {
      thrown = cause;
    }

    expect(thrown).to.be.instanceOf(Error);
    expect((thrown as Error).message).to.eql(
      'Driver Pi local GUI evidence output write failed.',
    );
    expect((thrown as Error).cause).to.equal(reported);
  });
});

function uniqueLineIndex(lines: readonly string[], fact: string): number {
  const indexes: number[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.includes(fact)) indexes.push(index);
  }
  expect(indexes.length).to.eql(1);
  return indexes[0] ?? -1;
}

function isRule(line: string): boolean {
  return line.length > 0 && line === '━'.repeat(line.length);
}
