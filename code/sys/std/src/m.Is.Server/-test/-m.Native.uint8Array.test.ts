import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.Native.uint8Array', () => {
  it('recognizes native byte arrays and rejects lookalikes', () => {
    expect(Is.Native.uint8Array(new Uint8Array(4))).to.eql(true);
    expect(Is.Native.uint8Array(new Uint16Array(4))).to.eql(false);
    expect(Is.Native.uint8Array(new ArrayBuffer(4))).to.eql(false);
    expect(Is.Native.uint8Array({ byteLength: 4 })).to.eql(false);
    expect(Is.Native.uint8Array(undefined)).to.eql(false);
  });

  it('rejects Uint8Array proxies without invoking traps', () => {
    let traps = 0;
    const proxy = new Proxy(new Uint8Array(4), {
      get() {
        traps += 1;
        throw new Error('Uint8Array proxy trap invoked.');
      },
      getPrototypeOf() {
        traps += 1;
        throw new Error('Uint8Array proxy trap invoked.');
      },
    });
    const revoked = Proxy.revocable(new Uint8Array(4), {});
    revoked.revoke();

    expect(Is.Native.uint8Array(proxy)).to.eql(false);
    expect(Is.Native.uint8Array(revoked.proxy)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
