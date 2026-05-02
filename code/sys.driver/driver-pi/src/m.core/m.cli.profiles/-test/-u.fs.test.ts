import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { ProfilesFs } from '../u.fs.ts';

describe(`@sys/driver-pi/cli/Profiles/u.fs`, () => {
  it('paths → derives canonical profile config location', () => {
    expect(ProfilesFs.dir).to.eql('-config/@sys.driver-pi');
    expect(ProfilesFs.ext).to.eql('.yaml');
    expect(ProfilesFs.fileOf('default')).to.eql('-config/@sys.driver-pi/default.yaml');
  });

  it('initialYaml → emits the minimal profile YAML shape', async () => {
    const text = ProfilesFs.initialYaml('default');
    for (
      const expected of [
        'prompt:',
        'system: null  # default: use DEFAULT_SYSTEM_PROMPT',
        'sandbox:',
        'read: []',
        'write: []',
        'env: {}',
        'context:',
        'append: []',
        'extra files loaded after ./AGENTS.md and ./SYSTEM.md',
      ]
    ) {
      expect(text).to.contain(expected);
    }

    const { dir, path } = await writeTempYaml(text);
    try {
      const check = await ProfilesFs.validateYaml(path);
      expect(check.ok).to.eql(true);
    } finally {
      await Fs.remove(dir);
    }
  });
});

async function writeTempYaml(text: string) {
  const dir = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.fs.test.' }))
    .absolute as t.StringDir;
  const path = `${dir}/profiles.yaml` as t.StringPath;
  await Fs.write(path, text);
  return { dir, path };
}
