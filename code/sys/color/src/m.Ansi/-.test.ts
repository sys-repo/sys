import { describe, expect, it } from '../-test.ts';
import { c, Color, stripAnsi } from './mod.ts';

describe('Ansi', () => {
  it('API', async () => {
    const m = await import('@sys/color/ansi');
    expect(m.Color).to.equal(Color);
    expect(m.c).to.equal(c);
    expect(m.stripAnsi).to.equal(stripAnsi);
    expect(Color.ansi).to.equal(c);
    expect(Color.foreground.green).to.equal(c.green);
    expect(Color.foreground.brightCyan).to.equal(c.brightCyan);
    expect(Color.rgb).to.equal(m.Color.rgb);
  });

  it('stripAnsi', () => {
    const text = c.bold(`${c.green('👋 Hello')}, ${c.italic(c.brightCyan('world!'))}`);
    expect(stripAnsi(text)).to.eql('👋 Hello, world!');
  });
});
