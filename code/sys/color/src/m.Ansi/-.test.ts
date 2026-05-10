import { describe, expect, it } from '../-test.ts';
import { c, Color, stripAnsi } from './mod.ts';

describe('Ansi', () => {
  it('API', async () => {
    const m = await import('@sys/color/ansi');

    expect(m.Color).to.equal(Color);
    expect(m.c).to.equal(Color);
    expect(m.stripAnsi).to.equal(stripAnsi);

    expect(Color.ansi).to.equal(c);
    expect(Color.foreground.green).to.equal(c.green);
    expect(Color.foreground.brightCyan).to.equal(c.brightCyan);
    expect(Color.escape).to.equal(m.Color.escape);
    expect(Color.rgb).to.equal(m.Color.rgb);
  });

  it('raw escape sequences', () => {
    expect(Color.escape.reset).to.eql('\x1b[0m');
    expect(Color.escape.italic).to.eql('\x1b[3m');
    expect(Color.escape.bold).to.eql('\x1b[1m');
    expect(Color.escape.underline).to.eql('\x1b[4m');
  });

  it('stripAnsi', () => {
    const text = c.bold(`${c.green('👋 Hello')}, ${c.italic(c.brightCyan('world!'))}`);
    expect(stripAnsi(text)).to.eql('👋 Hello, world!');
  });
});
