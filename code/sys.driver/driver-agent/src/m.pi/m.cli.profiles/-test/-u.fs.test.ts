import { describe, expect, it } from '../../../-test.ts';
import { ProfilesFs } from '../u.fs.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.fs`, () => {
  it('paths → derives canonical profile config location', () => {
    expect(ProfilesFs.dir).to.eql('-config/@sys.driver-agent.pi');
    expect(ProfilesFs.ext).to.eql('.yaml');
    expect(ProfilesFs.fileOf('default')).to.eql('-config/@sys.driver-agent.pi/default.yaml');
  });

  it('initialYaml → emits the minimal profile YAML shape', async () => {
    const text = ProfilesFs.initialYaml('default');
    expect(text).to.contain('profiles:');
    expect(text).to.contain('name: main');

    const { dir, path } = await writeTempYaml(text);
    try {
      const check = await ProfilesFs.validateYaml(path);
      expect(check.ok).to.eql(true);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });
});

async function writeTempYaml(text: string) {
  const dir = await Deno.makeTempDir();
  const path = `${dir}/profiles.yaml`;
  await Deno.writeTextFile(path, text);
  return { dir, path };
}
