import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { ServerCli } from '../mod.ts';
import { FmtHelp } from '../u.help.ts';
import { FmtDslHelp } from '../u.help.dsl.ts';
import { FmtRootHelp } from '../u.help.root.ts';

describe('m.cli root help', () => {
  it('freezes the CLI namespace graph', () => {
    expect(Object.isFrozen(ServerCli)).to.eql(true);
    expect(Object.isFrozen(FmtHelp)).to.eql(true);
    expect(Object.isFrozen(FmtRootHelp)).to.eql(true);
    expect(Object.isFrozen(FmtDslHelp)).to.eql(true);
  });

  it('empty argv prints root help', async () => {
    const res = await silent(() => ServerCli.run({ argv: [] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server');
    expect(text).to.contain('Usage');
    expect(text).to.contain('deno run -ER jsr:@sys/server --help');
    expect(text).to.contain('deno run -ER jsr:@sys/server dsl [chapter...]');
    expect(text).to.contain('Commands');
    expect(text).to.contain('dsl');
    expect(text).to.not.contain('start');
  });

  it('--help prints root help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['--help'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server');
    expect(text).to.contain('agent must read first');
  });

  it('unknown root option fails with root help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['--wat'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Unknown option: --wat');
    expect(text).to.contain('@sys/server');
    expect(text).to.contain('Commands');
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
