import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { ProfilesFs } from '../u.fs.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.fs`, () => {
  it('paths → derives canonical profile config location', () => {
    expect(ProfilesFs.dir).to.eql('-config/@sys.driver-agent.pi');
    expect(ProfilesFs.ext).to.eql('.yaml');
    expect(ProfilesFs.fileOf('default')).to.eql('-config/@sys.driver-agent.pi/default.yaml');
  });

  it('initialYaml → emits the minimal profile YAML shape', async () => {
    const text = ProfilesFs.initialYaml('default');
    expect(text).to.contain('# Typed Pi launcher policy.');
    expect(text).to.contain('prompt:');
    expect(text).to.contain('system: null  # replace the default system prompt when set');
    expect(text).to.contain('sandbox:');
    expect(text).to.contain('read: []   # extra readable paths');
    expect(text).to.contain('write: []  # extra writable paths');
    expect(text).to.contain('env: {}    # extra environment variables');
    expect(text).to.contain('include: []  # extra context files');

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
  const dir = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.u.fs.test.' })).absolute as t.StringDir;
  const path = `${dir}/profiles.yaml` as t.StringPath;
  await Fs.write(path, text);
  return { dir, path };
}
