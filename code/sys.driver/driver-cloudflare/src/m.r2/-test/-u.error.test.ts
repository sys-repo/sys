import { describe, expect, it } from '../../-test.ts';
import { isNotFound } from '../u/u.error.ts';

describe('R2 substrate error adapter', () => {
  it('recognizes not-found errors from HTTP status and substrate error codes', () => {
    expect(isNotFound({ status: 404 })).to.equal(true);
    expect(isNotFound({ cause: { status: 404 } })).to.equal(true);
    expect(isNotFound({ statusCode: 404 })).to.equal(true);
    expect(isNotFound({ code: 'NoSuchKey' })).to.equal(true);
    expect(isNotFound({ code: 'NotFound' })).to.equal(true);
  });

  it('does not hide non-not-found errors', () => {
    expect(isNotFound({ status: 403 })).to.equal(false);
    expect(isNotFound({ statusCode: 500 })).to.equal(false);
    expect(isNotFound({ code: 'AccessDenied' })).to.equal(false);
    expect(isNotFound(undefined)).to.equal(false);
  });
});
