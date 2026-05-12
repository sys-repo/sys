import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';

describe('@sys/cell/cli dsl', () => {
  it('dsl → routes to root DSL help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Chapter');
  });

  it('dsl pulled-view → routes to the pulled-view chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'pulled-view'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl pulled-view');
  });

  it('dsl pulled-view --format skill → routes to the skill projection', async () => {
    const res = await silent(() =>
      CellCli.run({ argv: ['dsl', 'pulled-view', '--format', 'skill'] })
    );
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(res.text).to.eql(text);
    expect(text).to.contain('name: "sys-cell-dsl-pulled-view"');
    expect(text).to.contain(
      'description: "Guides valid Cell folder edits; use when you need to add a view backed by an @sys/tools/pull config."',
    );
    expect(text).to.contain('# Pulled view');
    expect(text).to.not.contain('@sys/cell dsl pulled-view');
  });

  it('dsl --format human → preserves human DSL help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', '--format=human'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Chapter');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl pulled-view');
  });

  it('dsl --format unknown → fails clearly with root DSL help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', '--format', 'markdown'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Unsupported dsl format: markdown (expected: human, skill)');
    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Chapter');
  });

  it('dsl --format without value → fails clearly with root DSL help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', '--format'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Option requires a value: --format');
    expect(text).to.contain('@sys/cell dsl');
  });

  it('dsl repeated --format → fails clearly with root DSL help', async () => {
    const res = await silent(() =>
      CellCli.run({ argv: ['dsl', '--format', 'human', '--format', 'skill'] })
    );
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Repeated option for dsl: --format');
    expect(text).to.contain('@sys/cell dsl');
  });

  it('dsl static-http-service → routes to the static HTTP service chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'static-http-service'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl static-http-service');
  });

  it('dsl service → routes to the service chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'service'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl service');
  });

  it('dsl proxy-service → routes to the proxy service chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'proxy-service'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl proxy-service');
  });

  it('dsl start-services → routes to the start services chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'start-services'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl start-services');
  });

  it('dsl unknown → fails with root DSL help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'missing'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('CellHelp: DSL chapter not found: missing');
    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Chapter');
  });
});

async function silent<T>(fn: () => Promise<T>) {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}
