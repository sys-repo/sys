import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.Native.error', () => {
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

    expect(Is.Native.error(error)).to.eql(true);
    expect(Is.Native.error(new TypeError('test'))).to.eql(true);
    expect(Is.Native.error({ name: 'Error', message: 'test' })).to.eql(false);
    expect(Is.Native.error(undefined)).to.eql(false);
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

    expect(Is.Native.error(proxy)).to.eql(false);
    expect(Is.Native.error(revoked.proxy)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
