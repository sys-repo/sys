import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.Native.sharedArrayBuffer', () => {
  it('recognizes native shared buffers and rejects lookalikes', () => {
    expect(Is.Native.sharedArrayBuffer(new SharedArrayBuffer(4))).to.eql(true);
    expect(Is.Native.sharedArrayBuffer(new ArrayBuffer(4))).to.eql(false);
    expect(Is.Native.sharedArrayBuffer(new Uint8Array(4))).to.eql(false);
    expect(Is.Native.sharedArrayBuffer({ byteLength: 4 })).to.eql(false);
    expect(Is.Native.sharedArrayBuffer(undefined)).to.eql(false);
  });

  it('rejects SharedArrayBuffer proxies without invoking traps', () => {
    let traps = 0;
    const proxy = new Proxy(new SharedArrayBuffer(4), {
      get() {
        traps += 1;
        throw new Error('SharedArrayBuffer proxy trap invoked.');
      },
      getPrototypeOf() {
        traps += 1;
        throw new Error('SharedArrayBuffer proxy trap invoked.');
      },
    });
    const revoked = Proxy.revocable(new SharedArrayBuffer(4), {});
    revoked.revoke();

    expect(Is.Native.sharedArrayBuffer(proxy)).to.eql(false);
    expect(Is.Native.sharedArrayBuffer(revoked.proxy)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
