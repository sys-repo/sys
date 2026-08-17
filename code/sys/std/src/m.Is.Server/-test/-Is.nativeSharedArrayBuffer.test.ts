import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.nativeSharedArrayBuffer', () => {
  it('recognizes native shared buffers and rejects lookalikes', () => {
    expect(Is.nativeSharedArrayBuffer(new SharedArrayBuffer(4))).to.eql(true);
    expect(Is.nativeSharedArrayBuffer(new ArrayBuffer(4))).to.eql(false);
    expect(Is.nativeSharedArrayBuffer(new Uint8Array(4))).to.eql(false);
    expect(Is.nativeSharedArrayBuffer({ byteLength: 4 })).to.eql(false);
    expect(Is.nativeSharedArrayBuffer(undefined)).to.eql(false);
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

    expect(Is.nativeSharedArrayBuffer(proxy)).to.eql(false);
    expect(Is.nativeSharedArrayBuffer(revoked.proxy)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
