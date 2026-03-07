import { describe, expect, it } from '../../-test.ts';
import { shouldExclude } from '../u.exclude.ts';

describe('Deploy: shouldExclude', () => {
  it('matches basenames (path or name)', () => {
    expect(shouldExclude('.DS_Store')).to.eql(true);
    expect(shouldExclude('/tmp/.DS_Store')).to.eql(true);
    expect(shouldExclude('./foo/.DS_Store')).to.eql(true);
    expect(shouldExclude('nope.txt')).to.eql(false);
  });
});
