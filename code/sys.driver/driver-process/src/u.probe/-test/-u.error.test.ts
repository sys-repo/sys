import { describe, expect, it } from '../../-test.ts';
import { isMissingBinaryError } from '../mod.ts';

describe(`u.error`, () => {
  it('classifies missing-binary errors accurately', () => {
    expect(isMissingBinaryError(new Error('ENOENT: no such file or directory'))).to.eql(true);
    expect(isMissingBinaryError('not found')).to.eql(true);
    expect(isMissingBinaryError('cannot find')).to.eql(true);
    expect(isMissingBinaryError('permission denied')).to.eql(false);
  });
});
