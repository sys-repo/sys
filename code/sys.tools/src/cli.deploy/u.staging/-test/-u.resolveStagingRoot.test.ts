import { describe, expect, expectError, it } from '../../../-test.ts';
import { resolveStagingRoot } from '../u.resolveStagingRoot.ts';

describe('Deploy: resolveStagingRoot', () => {
  it('resolves one dedicated relative descendant with an optional explicit-relative prefix', () => {
    const explicit = resolveStagingRoot({ cwd: '/tmp/root', stagingRootRel: './staging/site' });
    const bare = resolveStagingRoot({ cwd: '/tmp/root', stagingRootRel: 'staging/site' });
    expect(explicit).to.eql('/tmp/root/staging/site');
    expect(bare).to.eql(explicit);
  });

  for (
    const input of [
      '',
      '.',
      './',
      '..',
      '../stage',
      'a/../../stage',
      '/tmp/stage',
      'C:/tmp/stage',
      'C:tmp/stage',
      'C:\\tmp\\stage',
      '~',
      '~/stage',
      '~user/stage',
      ' stage',
      'stage ',
      'stage/',
      'stage//nested',
      'stage/.',
      '././stage',
      'stage.',
      'CON',
      '.sys.rooted',
      'bad:name',
    ]
  ) {
    it(`rejects unsafe root: ${JSON.stringify(input)}`, async () => {
      await expectError(
        () => Promise.resolve(resolveStagingRoot({ cwd: '/tmp/root', stagingRootRel: input })),
        'Deploy staging root is invalid',
      );
    });
  }
});
