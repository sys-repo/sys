import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.extend', () => {
  it('deeply clones and preseves dynamic properties', () => {
    let _count = 0;
    let _msg = 'hello';
    const obj = {
      get count() {
        return _count;
      },
      set count(v) {
        _count = v;
      },
      get msg() {
        return _msg;
      },
      child: { count: 0 },
    };
    obj.child = obj;

    const res = Obj.extend(obj, {
      foo: 'hello',
      get bar() {
        return _msg + _count;
      },
    });

    expect(res).to.not.equal(obj);
    expect(res.child).to.not.equal(obj.child);
    expect(res.child).to.equal(res);

    _count = 123;
    _msg = '👋';
    expect(res.foo).to.eql('hello');
    expect(res.count).to.eql(123);
    expect(res.child.count).to.eql(123);
    expect(res.msg).to.eql('👋');
    expect(res.bar).to.eql('👋123');

    res.count = 42;
    expect(_count).to.eql(42);
    expect((obj as any).foo).to.be.undefined;

    const foo = Object.getOwnPropertyDescriptor(res, 'foo')!;
    expect(foo.enumerable).to.be.true;
    expect(foo.configurable).to.be.true;
    expect(foo.writable).to.be.true;

    const msg = Object.getOwnPropertyDescriptor(res, 'msg')!;
    expect(msg.enumerable).to.be.true;
    expect(msg.configurable).to.be.true;
    expect(msg.writable).to.be.undefined;
  });
});
