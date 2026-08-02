import { describe, expect, it } from '../../../-test.ts';
import { isAbortError } from '../u/u.abort.ts';

describe('HttpPull abort classification', () => {
  it('recognizes supported markers without trusting hostile records', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).to.eql(true);
    expect(isAbortError({ code: 'ABORT_ERR' })).to.eql(true);
    expect(isAbortError({ message: 'disposed' })).to.eql(true);
    expect(isAbortError(new Error('ordinary'))).to.eql(false);

    const throwing = Object.defineProperty({}, 'name', {
      get: () => {
        throw new Error('hostile getter');
      },
    });
    expect(isAbortError(throwing)).to.eql(false);

    const revocable = Proxy.revocable({}, {});
    revocable.revoke();
    expect(isAbortError(revocable.proxy)).to.eql(false);
  });
});
