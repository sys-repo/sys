import { describe, expect, it } from '../../../-test.ts';
import { isUnavailableError } from '../u.isUnavailableError.ts';

describe('Cli.Keyboard.isUnavailableError', () => {
  it('recognizes native terminal-unavailability errors', () => {
    expect(isUnavailableError(new Deno.errors.BadResource('closed keyboard'))).to.eql(true);
    expect(isUnavailableError(new Error('ENOTTY'))).to.eql(true);
    expect(isUnavailableError(new Error('No such device'))).to.eql(true);
    expect(isUnavailableError(new Error('other failure'))).to.eql(false);
  });

  it('rejects hostile values without invoking accessors or Proxy traps', () => {
    let trapCalls = 0;
    const native = new Error('ENOTTY');
    Object.defineProperty(native, 'message', {
      configurable: true,
      get() {
        trapCalls += 1;
        throw new Error('message trap');
      },
    });
    const proxy = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap');
      },
    });
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();

    expect(isUnavailableError(native)).to.eql(false);
    expect(isUnavailableError(proxy)).to.eql(false);
    expect(isUnavailableError(revoked.proxy)).to.eql(false);
    expect(trapCalls).to.eql(0);
  });
});
