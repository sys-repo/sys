import { Cli, describe, expect, it, Semver, type t } from '../../-test.ts';
import { WorkspaceBump } from '../mod.ts';

describe(`@sys/workspace/bump Fmt`, () => {
  it('formats invalid release warnings', () => {
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('argument not supported');
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('--release=');
  });

  it('formats canonical bump phase labels', () => {
    const a = WorkspaceBump.Fmt.phase({ kind: 'collect' });
    const b = WorkspaceBump.Fmt.phase({ kind: 'followup', followup: 'post-bump prep' });
    const c = WorkspaceBump.Fmt.phase({ kind: 'integrity' });
    expect(a).to.eql('calculating workspace bump plan...');
    expect(b).to.eql('running post-bump prep...');
    expect(c).to.eql('checking non-bumped package integrity...');
  });

  it('formats bump-required plan summaries as verdict-first', () => {
    const root = candidate('@sys/yaml', 'code/sys/yaml');
    const selected = [root, candidate('@sample/proxy', 'deploy/sample.proxy')];
    const lines = WorkspaceBump.Fmt.planSummary({
      plan: { roots: [root], selected, selectedPaths: selected.map((item) => item.pkgPath) },
    });
    const text = Cli.stripAnsi(lines.join('\n'));

    expect(Cli.stripAnsi(lines[0] ?? '')).to.include('status     bump required');
    expect(text).to.include('affected   2 packages');
    expect(text).to.include('root       @sys/yaml');
  });

  it('formats empty plan summaries as no-bump verdicts', () => {
    const lines = WorkspaceBump.Fmt.planSummary({
      plan: { roots: [], selected: [], selectedPaths: [] },
    });
    const text = Cli.stripAnsi(lines.join('\n'));

    expect(text).to.include('status     no bump required');
    expect(text).to.include('affected   0 packages');
  });

  it('separates dry-run notices with a strong gray horizontal rule', () => {
    const lines = WorkspaceBump.Fmt.dryRun().split('\n');

    expect(lines[0]).to.eql(Cli.Fmt.hr('gray'));
    expect(Cli.stripAnsi(lines[1] ?? '')).to.eql('Dry run only. No files updated.');
  });

  it('keeps bump help within 80 visible columns', () => {
    const text = silentInfo(() => WorkspaceBump.Fmt.help());
    expectMaxVisibleWidth(text, 80);
  });
});

function candidate(name: string, pkgPath: t.StringPath): t.WorkspaceBump.Candidate {
  const current = Semver.parse('0.0.1').version;
  const next = Semver.parse('0.0.2').version;
  return {
    name,
    pkgPath,
    denoFilePath: `${pkgPath}/deno.json`,
    version: { current, next },
  };
}

function silentInfo<T>(fn: () => T): T {
  const info = console.info;
  console.info = () => undefined;

  try {
    return fn();
  } finally {
    console.info = info;
  }
}

function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}
