import { describe, expect, it } from '../../-test.ts';
import { dedent, trimEdgeNewlines } from '../u.text.ts';

describe('Root Text', () => {
  it('trims edge newlines', () => {
    expect(trimEdgeNewlines('\n\nhello\n\n')).to.eql('hello');
    expect(trimEdgeNewlines('hello')).to.eql('hello');
  });

  it('dedents root-local text blocks', () => {
    const text = dedent(`
      one
        two
    `);

    expect(text).to.eql('one\n  two');
  });
});
