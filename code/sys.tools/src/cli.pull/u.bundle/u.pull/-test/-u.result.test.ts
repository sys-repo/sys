import { describe, expect, it } from '../../../../-test.ts';
import { errorMessage } from '../u.result.ts';

describe('cli.pull/u.bundle/u.pull → result helpers', () => {
  it('redacts bearer and GitHub tokens from error messages', () => {
    const message = errorMessage(
      new Error(
        'failed with Authorization: Bearer ghp_123456789012345678901234 and https://example.test/?token=github_pat_123456789012345678901234',
      ),
    );

    expect(message.includes('ghp_123456789012345678901234')).to.eql(false);
    expect(message.includes('github_pat_123456789012345678901234')).to.eql(false);
    expect(message.includes('Bearer [redacted]')).to.eql(true);
    expect(message.includes('token=[redacted]')).to.eql(true);
  });
});
