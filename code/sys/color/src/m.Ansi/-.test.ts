import { describe, expect, it } from '../-test.ts';
import { ANSI, c, Color, stripAnsi } from './mod.ts';

describe('Ansi', () => {
  it('API', async () => {
    const m = await import('@sys/color/ansi');
    expect(m.ANSI).to.equal(ANSI);
    expect(m.Color).to.equal(Color);
    expect(m.c).to.equal(c);
    expect(m.stripAnsi).to.equal(stripAnsi);
    expect(Color.ansi).to.equal(c);
    expect(Color.foreground.green).to.equal(c.green);
    expect(Color.foreground.brightCyan).to.equal(c.brightCyan);
    expect(Color.escape).to.equal(ANSI);
    expect(Color.rgb).to.equal(m.Color.rgb);
  });

  it('raw escape sequences', () => {
    expect(ANSI.reset).to.eql('\x1b[0m');
    expect(ANSI.italic).to.eql('\x1b[3m');
    expect(ANSI.bold).to.eql('\x1b[1m');
    expect(ANSI.underline).to.eql('\x1b[4m');
  });

  it('stripAnsi', () => {
    const text = c.bold(`${c.green('👋 Hello')}, ${c.italic(c.brightCyan('world!'))}`);
    expect(stripAnsi(text)).to.eql('👋 Hello, world!');
  });
});
