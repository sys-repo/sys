import { describe, expect, it } from '../../-test.ts';
import { Is } from '../mod.ts';

describe('Is.proxy', () => {
  it('detects live and revoked proxies without invoking traps', () => {
    let traps = 0;
    const proxy = new Proxy({}, {
      get() {
        traps += 1;
        throw new Error('Proxy trap invoked.');
      },
      getPrototypeOf() {
        traps += 1;
        throw new Error('Proxy trap invoked.');
      },
    });
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();

    expect(Is.proxy(proxy)).to.eql(true);
    expect(Is.proxy(revoked.proxy)).to.eql(true);
    expect(Is.proxy({})).to.eql(false);
    expect(Is.proxy(undefined)).to.eql(false);
    expect(traps).to.eql(0);
  });
});
