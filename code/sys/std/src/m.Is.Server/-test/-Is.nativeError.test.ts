import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.nativeError', () => {
  it('recognizes native errors without reading properties', () => {
    let reads = 0;
    const error = new Error('test');
    Object.defineProperty(error, 'message', {
      configurable: true,
      get() {
        reads += 1;
        throw new Error('Error property read.');
      },
    });

    expect(Is.nativeError(error)).to.eql(true);
    expect(Is.nativeError(new TypeError('test'))).to.eql(true);
    expect(Is.nativeError({ name: 'Error', message: 'test' })).to.eql(false);
    expect(Is.nativeError(undefined)).to.eql(false);
    expect(reads).to.eql(0);
  });

  it('rejects Error proxies without invoking traps', () => {
    let traps = 0;
    const proxy = new Proxy(new Error('hostile'), {
      get() {
        traps += 1;
        throw new Error('Error proxy trap invoked.');
      },
      getPrototypeOf() {
        traps += 1;
        throw new Error('Error proxy trap invoked.');
      },
    });
    const revoked = Proxy.revocable(new Error('hostile'), {});
    revoked.revoke();

    expect(Is.nativeError(proxy)).to.eql(false);
    expect(Is.nativeError(revoked.proxy)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
