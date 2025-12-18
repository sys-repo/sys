import { describe, expect, it } from '../../-test.ts';
import { Filter } from '../mod.ts';

describe(`Filter.parse`, () => {
  it('trims edges and collapses internal whitespace', () => {
    const res = Filter.parse('   foo   bar   ');
    expect(res).to.eql({
      text: 'foo bar',
      tokens: ['foo', 'bar'],
    });
  });

  it('splits on mixed whitespace (tabs/newlines)', () => {
    const res = Filter.parse('foo\tbar\nbaz\r\nqux');
    expect(res).to.eql({
      text: 'foo bar baz qux',
      tokens: ['foo', 'bar', 'baz', 'qux'],
    });
  });

  it('returns empty text with no tokens for whitespace-only input', () => {
    const res = Filter.parse('   \n\t  ');
    expect(res.text).to.eql('');
    expect(res.tokens).to.eql(undefined);
  });

  it('returns empty text with no tokens for empty input', () => {
    const res = Filter.parse('');
    expect(res.text).to.eql('');
    expect(res.tokens).to.eql(undefined);
  });

  it('preserves case and punctuation (lexical normalization only)', () => {
    const res = Filter.parse('  Foo/Bar.ts  -test   ');
    expect(res).to.eql({
      text: 'Foo/Bar.ts -test',
      tokens: ['Foo/Bar.ts', '-test'],
    });
  });

  it('does not emit empty tokens', () => {
    const res = Filter.parse('a    b     c');
    expect(res.tokens).to.eql(['a', 'b', 'c']);
  });
});
