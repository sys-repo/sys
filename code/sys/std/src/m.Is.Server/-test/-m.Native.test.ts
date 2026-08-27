import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Is as BaseIs } from '../../m.Is/mod.ts';
import { Is } from '../mod.ts';

describe('Is.Native', () => {
  it('exposes the host-native namespace without changing flat predicate identity', () => {
    expect(Object.keys(Is.Native)).to.eql([
      'proxy',
      'promise',
      'error',
      'uint8Array',
      'sharedArrayBuffer',
    ]);
    expect(Is.Native.proxy).to.equal(Is.proxy);
    expect(Is.Native.promise).to.equal(Is.nativePromise);
    expect(Is.Native.error).to.equal(Is.nativeError);
    expect(Is.Native.uint8Array).to.equal(Is.nativeUint8Array);
    expect(Is.Native.sharedArrayBuffer).to.equal(Is.nativeSharedArrayBuffer);
    expect(Object.isFrozen(Is.Native)).to.eql(true);
    expect(Object.isFrozen(Is)).to.eql(true);
    expectTypeOf(Is.Native).toEqualTypeOf<t.Is.Server.Native.Lib>();
  });

  it('preserves host-native type narrowing', () => {
    const promise: unknown = Promise.resolve();
    const error: unknown = new Error('test');
    const bytes: unknown = new Uint8Array();
    const shared: unknown = new SharedArrayBuffer();

    if (Is.Native.promise(promise)) expectTypeOf(promise).toEqualTypeOf<Promise<unknown>>();
    if (Is.Native.error(error)) expectTypeOf(error).toEqualTypeOf<Error>();
    if (Is.Native.uint8Array(bytes)) expectTypeOf(bytes).toEqualTypeOf<Uint8Array>();
    if (Is.Native.sharedArrayBuffer(shared)) {
      expectTypeOf(shared).toEqualTypeOf<SharedArrayBuffer>();
    }
  });

  it('keeps the universal Is surface browser-safe', async () => {
    const universal = await import('@sys/std/is');

    expect(universal.Is).to.equal(BaseIs);
    expect('Native' in universal.Is).to.eql(false);
    expectTypeOf(universal.Is).toEqualTypeOf<t.Is.Lib>();
  });
});
