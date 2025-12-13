import { Diff } from './mod.ts';
import { describe, expect, it } from '../-test.ts';

describe('Diff', () => {
  it('no change', () => {
    const res1 = Diff.chars('hello', 'hello'); // NB: Case-sensitive by default.
    const res2 = Diff.chars('hello', 'Hello', { ignoreCase: true });

    expect(res1.length).to.eql(1);
    expect(res2.length).to.eql(1);

    expect(res1[0].kind).to.eql('Unchanged');
    expect(res2[0].kind).to.eql('Unchanged');

    expect(res1[0].index).to.eql(0);
    expect(res2[0].index).to.eql(0);

    expect(res1[0].value).to.eql('hello');
    expect(res2[0].value).to.eql('Hello');
  });

  it('add', () => {
    const res = Diff.chars('hello', 'hello world');
    expect(res.length).to.eql(2);

    expect(res[0].kind).to.eql('Unchanged');
    expect(res[1].kind).to.eql('Added');

    expect(res[0].index).to.eql(0);
    expect(res[1].index).to.eql(5);

    expect(res[0].value).to.eql('hello');
    expect(res[1].value).to.eql(' world');
  });

  it('delete', () => {
    const res = Diff.chars('hello world', 'hello');

    expect(res.length).to.eql(2);

    expect(res[0].kind).to.eql('Unchanged');
    expect(res[1].kind).to.eql('Deleted');

    expect(res[0].index).to.eql(0);
    expect(res[1].index).to.eql(5);

    expect(res[0].value).to.eql('hello');
    expect(res[1].value).to.eql(' world');
  });
});
