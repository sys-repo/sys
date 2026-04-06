import { describe, expect, it } from '../-test.ts';
import { Diff } from './mod.ts';

describe('Diff', () => {
  it('API', async () => {
    const m = await import('@sys/text/diff');
    expect(m.Diff).to.equal(Diff);
  });

  it('no change', () => {
    const res1 = Diff.chars('hello', 'hello'); // NB: Case-sensitive by default.
    const res2 = Diff.chars('hello', 'Hello', { ignoreCase: true });

    expect(res1.length).to.eql(1);
    expect(res2.length).to.eql(1);

    expect(res1[0].kind).to.eql('Unchanged');
    expect(res2[0].kind).to.eql('Unchanged');

    expect(res1[0].value).to.eql('hello');
    expect(res2[0].value).to.eql('Hello');
  });

  it('add', () => {
    const res = Diff.chars('hello', 'hello world');
    expect(res.length).to.eql(2);

    expect(res[0].kind).to.eql('Unchanged');
    expect(res[1].kind).to.eql('Added');

    expect(res[0].value).to.eql('hello');
    expect(res[1].value).to.eql(' world');
  });

  it('delete', () => {
    const res = Diff.chars('hello world', 'hello');

    expect(res.length).to.eql(2);

    expect(res[0].kind).to.eql('Unchanged');
    expect(res[1].kind).to.eql('Deleted');

    expect(res[0].value).to.eql('hello');
    expect(res[1].value).to.eql(' world');
  });
});
