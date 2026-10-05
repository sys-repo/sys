import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.toArray', () => {
  type IFoo = { count: number };
  type IFoos = {
    one: IFoo;
    two: IFoo;
  };
  const foos: IFoos = { one: { count: 1 }, two: { count: 2 } };

  it('empty', () => {
    expect(Obj.toArray({})).to.eql([]);
  });

  it('converts to array (untyped)', () => {
    const res = Obj.toArray(foos);
    expect(res.length).to.eql(2);
  });

  it('converts to array (typed object)', () => {
    const res = Obj.toArray<IFoos>(foos);
    expect(res.length).to.eql(2);

    expect(res[0].key).to.eql('one');
    expect(res[1].key).to.eql('two');

    expect(res[0].value).to.eql({ count: 1 });
    expect(res[1].value).to.eql({ count: 2 });
  });

  it('converts to array (typed key)', () => {
    type K = 'foo' | 'bar';
    const res = Obj.toArray<IFoos, K>(foos);
    expect(res.length).to.eql(2);
  });
});
