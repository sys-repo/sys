import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.nativePromise', () => {
  it('recognizes native promises without reading properties', () => {
    const reads: string[] = [];
    const promise = Promise.resolve(123);
    Object.defineProperties(promise, {
      constructor: {
        configurable: true,
        get() {
          reads.push('constructor');
          throw new Error('Promise property read.');
        },
      },
      then: {
        configurable: true,
        get() {
          reads.push('then');
          throw new Error('Promise property read.');
        },
      },
    });

    expect(Is.nativePromise(promise)).to.eql(true);
    expect(Is.nativePromise(new Promise<void>(() => undefined))).to.eql(true);
    expect(Is.nativePromise({ then() {} })).to.eql(false);
    expect(Is.nativePromise(Object.create(Promise.prototype))).to.eql(false);
    expect(Is.nativePromise(undefined)).to.eql(false);
    expect(reads).to.eql([]);
  });

  it('rejects Promise proxies without invoking traps', () => {
    let traps = 0;
    const proxy = new Proxy(Promise.resolve(), {
      get() {
        traps += 1;
        throw new Error('Promise proxy trap invoked.');
      },
      getPrototypeOf() {
        traps += 1;
        throw new Error('Promise proxy trap invoked.');
      },
    });
    const revoked = Proxy.revocable(Promise.resolve(), {});
    revoked.revoke();

    expect(Is.nativePromise(proxy)).to.eql(false);
    expect(Is.nativePromise(revoked.proxy)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
