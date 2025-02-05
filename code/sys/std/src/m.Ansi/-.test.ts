import { describe, expect, it } from '../-test.ts';
import { c, stripAnsi } from './mod.ts';

describe('Ansi Colors', () => {
  it('sample', () => {
    const msg = `I see a ${c.brightCyan('cyan door')} and I want it painted ${c.black('black')}.`;
    console.info(msg);
  });

  it('stripAnsi', () => {
    const text = c.green('foo');
    expect(text).to.not.eql('foo');
    expect(stripAnsi(text)).to.eql('foo');
  });
});
