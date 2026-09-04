import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { expectCliError, silent } from './u.fixture.ts';

describe('@sys/cell/cli dsl', () => {
  it('dsl → routes to root DSL help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Chapter');
  });

  it('dsl <chapter> → routes to requested DSL help', async () => {
    const paths = [
      'pulled-view',
      'static-serve-service',
      'service',
      'proxy-service',
      'start-services',
      'examples',
    ];

    for (const path of paths) {
      const res = await silent(() => CellCli.run({ argv: ['dsl', path] }));
      const text = stripAnsi(res.text);

      expect(res.kind).to.eql('help');
      expect(text).to.contain(`@sys/cell dsl ${path}`);
    }
  });

  it('dsl --format human → preserves human DSL routing', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', '--format=human'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Chapter');
  });

  it('dsl --format skill → routes to skill projection', async () => {
    const root = await silent(() => CellCli.run({ argv: ['dsl', '--format', 'skill'] }));
    const child = await silent(() =>
      CellCli.run({ argv: ['dsl', 'pulled-view', '--format', 'skill'] })
    );

    expect(root.kind).to.eql('help');
    expect(child.kind).to.eql('help');
    expect(root.text).to.contain('name: "sys-cell-dsl"');
    expect(child.text).to.contain('name: "sys-cell-dsl-pulled-view"');
    expect(root.text).to.eql(stripAnsi(root.text));
    expect(child.text).to.eql(stripAnsi(child.text));
  });

  it('dsl → rejects invalid format invocations', async () => {
    await expectCliError(
      ['dsl', '--format', 'markdown'],
      'Unsupported dsl format: markdown (expected: human, skill)',
    );
    await expectCliError(['dsl', '--format'], 'Option requires a value: --format');
    await expectCliError(
      ['dsl', '--format', 'human', '--format', 'skill'],
      'Repeated option for dsl: --format',
    );
  });

  it('dsl unknown → fails with a missing chapter error', async () => {
    await expectCliError(['dsl', 'missing'], 'CellHelp: DSL chapter not found: missing');
  });
});
