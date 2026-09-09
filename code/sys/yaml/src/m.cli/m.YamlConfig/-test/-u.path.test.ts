import { describe, expect, expectError, it } from '../../../-test.ts';
import { RefPath } from '../u/u.path.ts';

describe('YamlConfig RefPath', () => {
  it('requireValue trims present values and rejects missing values', async () => {
    expect(RefPath.requireValue(' view ', '--config', 'Test')).to.eql('view');
    await expectError(
      () => RefPath.requireValue('', '--config', 'Test'),
      'Test: missing required --config.',
    );
  });

  it('normalizes YAML extensions', () => {
    expect(RefPath.normalizeExt()).to.eql('.yaml');
    expect(RefPath.normalizeExt('')).to.eql('.yaml');
    expect(RefPath.normalizeExt('yml')).to.eql('.yml');
    expect(RefPath.normalizeExt('.yaml')).to.eql('.yaml');
  });

  it('trims trailing slashes from config dirs', () => {
    expect(RefPath.trimTrailingSlash('./-config/@sys.http/static///')).to.eql(
      './-config/@sys.http/static',
    );
  });

  it('classifies explicit path-like config selectors', () => {
    expect(RefPath.isPathLike('/tmp/profile.yaml')).to.eql(true);
    expect(RefPath.isPathLike('./profile')).to.eql(true);
    expect(RefPath.isPathLike('../profile')).to.eql(true);
    expect(RefPath.isPathLike('~/profile')).to.eql(true);
    expect(RefPath.isPathLike('nested/profile')).to.eql(true);
    expect(RefPath.isPathLike('profile.yaml')).to.eql(true);
    expect(RefPath.isPathLike('profile.yml')).to.eql(true);
    expect(RefPath.isPathLike('profile')).to.eql(false);
  });

  it('derives config names from YAML paths', async () => {
    expect(RefPath.nameFromPath('./-config/@sys.http/static/view.yaml', '--config', 'Test'))
      .to.eql('view');
    expect(RefPath.nameFromPath('static.view.yml', '--config', 'Test')).to.eql('static.view');
    await expectError(
      () => RefPath.nameFromPath('.yaml', '--config', 'Test'),
      'Test: could not derive name from --config.',
    );
  });
});
