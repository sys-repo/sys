import { describe, expect, it } from '../-test.ts';
import { c, Color, stripAnsi } from './mod.ts';

describe('Ansi', () => {
  it('API', async () => {
    const m = await import('@sys/color/ansi');
    expect(m.Color).to.equal(Color);
    expect(m.c).to.eql(c);
    expect(m.stripAnsi).to.eql(stripAnsi);
  });

  it('stripAnsi', () => {
    const text = c.bold(`${c.green('👋 Hello')}, ${c.italic(c.brightCyan('world!'))}`);
    expect(stripAnsi(text)).to.eql('👋 Hello, world!');
  });
});
