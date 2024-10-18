import { describe, expect, it } from '../-test.ts';
import { Fuzzy } from './mod.ts';

describe('Fuzzy (Approx String Match)', () => {
  it('surfaces "pattern"', () => {
    const res = Fuzzy.pattern('zoo');
    expect(res.pattern).to.eql('zoo');
  });

  it('undefined', () => {
    const res1 = Fuzzy.pattern('zoo').match(undefined);
    const res2 = Fuzzy.pattern('zoo').match(null as any);

    expect(res1.exists).to.eql(false);
    expect(res2.exists).to.eql(false);
  });

  it('no match', () => {
    const res = Fuzzy.pattern('zoo', { maxErrors: 1 }).match('apple');
    expect(res.exists).to.eql(false);
    expect(res.matches).to.eql([]);
    expect(res.text).to.eql('apple');
    expect(res.pattern).to.eql('zoo');
    expect(res.range).to.eql({ start: -1, end: -1, text: '' });
  });

  it('no match', () => {
    const res = Fuzzy.pattern('foo').match('z');
    expect(res.exists).to.eql(false);
    expect(res.matches).to.eql([]);
    expect(res.text).to.eql('z');
    expect(res.pattern).to.eql('foo');
    expect(res.range).to.eql({ start: -1, end: -1, text: '' });
  });

  it('match', () => {
    const res1 = Fuzzy.pattern('hme').match('welcome home bubba');
    const res2 = Fuzzy.pattern('baz').match('welcome home bubfaz');

    expect(res1.exists).to.eql(true);
    expect(res2.exists).to.eql(true);

    expect(res1.range).to.eql({ start: 4, end: 12, text: 'ome home' });
    expect(res2.range).to.eql({ start: 15, end: 19, text: 'bfaz' });
  });
});
