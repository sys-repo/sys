import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { ProfilePath } from '../u.path.ts';

describe(`@sys/driver-pi/cli/Profiles/u.path`, () => {
  it('uses the runtime root instead of the invoked nested cwd', () => {
    const root = '/tmp/org.sys/sys' as t.StringDir;
    const invoked = `${root}/code/sys/cell/-sample/foo` as t.StringDir;

    expect(ProfilePath.root({ invoked, git: root })).to.eql(root);
    expect(ProfilePath.resolve(root, '../sys.canon/AGENTS.md')).to.eql(
      '/tmp/org.sys/sys.canon/AGENTS.md',
    );
  });

  it('normalizes profile-authored path lists from the runtime root', () => {
    const root = '/tmp/org.sys/sys' as t.StringDir;
    const paths = ProfilePath.resolveAll(root, ['./canon', '/tmp/extra']);
    expect(paths).to.eql([Fs.join(root, 'canon'), '/tmp/extra']);
  });
});
