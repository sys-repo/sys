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

  it('dsl static-http-service → routes to the static HTTP service chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'static-http-service'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl static-http-service');
  });

  it('dsl proxy-service → routes to the proxy service chapter', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl', 'proxy-service'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell dsl proxy-service');
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
