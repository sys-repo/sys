import { describe, expect, it } from '../-test.ts';
import { c, colors, stripAnsi } from './mod.ts';

describe('Ansi Colors', () => {
  it('API wiring', async () => {
    const m = await import('@sys/std/ansi/server');
    expect(m.c).to.equal(c);
    expect(m.colors).to.equal(colors);
    expect(m.stripAnsi).to.equal(stripAnsi);
    expect(c).to.equal(colors);
    expect(c.green).to.equal(colors.green);
    expect(c.bold).to.equal(colors.bold);
    expect(c.stripAnsiCode).to.be.a('function');
  });

  it('stripAnsi removes nested formatting', () => {
    const enabled = c.getColorEnabled();
    c.setColorEnabled(true);
    try {
      const text = c.bold(`${c.green('foo')} ${c.italic(c.brightCyan('bar'))}`);
      expect(stripAnsi(text)).to.eql('foo bar');
    } finally {
      c.setColorEnabled(enabled);
    }
  });

  it('stripAnsi is identity for plain strings', () => {
    expect(stripAnsi('foo')).to.eql('foo');
  });

  it('stripAnsi removes multiple ansi segments in one string', () => {
    const enabled = c.getColorEnabled();
    c.setColorEnabled(true);
    try {
      const text = `${c.red('foo')} :: ${c.bgBlue(c.white('bar'))}`;
      expect(stripAnsi(text)).to.eql('foo :: bar');
    } finally {
      c.setColorEnabled(enabled);
    }
  });

  it('stripAnsiCode matches stripAnsi behavior', () => {
    const text = c.yellow('baz');
    expect(c.stripAnsiCode(text)).to.eql(stripAnsi(text));
  });
});
