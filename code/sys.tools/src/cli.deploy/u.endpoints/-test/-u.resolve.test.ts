import { describe, expect, expectError, it, Path } from '../../../-test.ts';
import { isHomePath, resolvePath } from '../u.resolve.ts';

describe('Deploy endpoint path resolution', () => {
  it('recognizes only canonical HOME-relative syntax', () => {
    expect(isHomePath('~')).to.eql(true);
    expect(isHomePath('~/source')).to.eql(true);
    expect(isHomePath('~user/source')).to.eql(false);
    expect(isHomePath('./~/source')).to.eql(false);
  });

  it('does not enter tilde expansion for relative, absolute, or ~user paths', () => {
    const expandTilde = () => {
      throw new Error('tilde resolver should not run');
    };
    const absolute = Path.resolve('/repo', 'absolute-source');

    expect(resolvePath('/repo', './source', { expandTilde })).to.eql('/repo/source');
    expect(resolvePath('/repo', absolute, { expandTilde })).to.eql(absolute);
    expect(resolvePath('/repo', '~user/source', { expandTilde })).to.eql('/repo/~user/source');
  });

  it('preserves exact path text instead of trimming to a sibling', () => {
    expect(resolvePath('/repo', ' source')).to.eql('/repo/ source');
    expect(resolvePath('/repo', 'source ')).to.eql('/repo/source ');
  });

  it('delegates canonical tilde paths to Fs.Tilde-compatible expansion', () => {
    let calls = 0;
    const resolved = resolvePath('/repo', '~/source', {
      expandTilde: (input) => {
        calls += 1;
        expect(input).to.eql('~/source');
        return '/home/tester/source';
      },
    });

    expect(resolved).to.eql('/home/tester/source');
    expect(calls).to.eql(1);
  });

  it('fails clearly when a canonical tilde path cannot resolve HOME', async () => {
    await expectError(
      () => resolvePath('/repo', '~/source', { expandTilde: (input) => input }),
      'HOME value is required to resolve path: ~/source',
    );
  });
});
