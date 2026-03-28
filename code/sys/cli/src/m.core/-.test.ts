import { describe, expect, it } from '../-test.ts';
import { Args, c, Cli, Color, Fmt, Keyboard, Prompt, Spinner, stripAnsi, Table } from './mod.ts';

describe('CLI: core / m.Cli', () => {
  it('API', async () => {
    const m = await import('@sys/cli/core');
    expect(m.Cli).to.equal(Cli);

    expect(m.Args).to.equal(Args);
    expect(m.Fmt).to.equal(Fmt);
    expect(m.Keyboard).to.equal(Keyboard);
    expect(m.Prompt).to.equal(Prompt);
    expect(m.Spinner).to.equal(Spinner);
    expect(m.Table).to.equal(Table);

    expect(m.stripAnsi).to.equal(stripAnsi);
    expect(m.c).to.equal(c);
    expect(m.Color).to.equal(Color);
  });
});
