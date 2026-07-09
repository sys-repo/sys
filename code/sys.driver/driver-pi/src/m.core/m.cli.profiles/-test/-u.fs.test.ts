import { describe, expect, it } from '../../../-test.ts';
import { Fs, Str, type t } from '../common.ts';
import { ProfilesFs } from '../u.fs.ts';

describe(`@sys/driver-pi/cli/Profiles/u.fs`, () => {
  it('paths → derives canonical profile config location', () => {
    expect(ProfilesFs.dir).to.eql('-config/@sys.driver-pi');
    expect(ProfilesFs.ext).to.eql('.yaml');
    expect(ProfilesFs.fileOf('default')).to.eql('-config/@sys.driver-pi/default.yaml');
  });

  it('initialYaml → emits the minimal profile YAML shape', async () => {
    const text = ProfilesFs.initialYaml();
    expect(text).to.contain(Str.dedent(
      `
      #
      # Launcher profile. Docs: https://jsr.io/@sys/driver-pi
      #
      `,
    ));
    expect(text).not.to.contain('# pi profile: default');
    expect(text).not.to.contain('# Typed Pi launcher policy.');

    expect(text).not.to.contain('prompt:');
    expect(text).not.to.contain('# null → managed default; string → replacement prompt.');
    expect(text).not.to.contain('DEFAULT_SYSTEM_PROMPT');
    expect(text).to.contain(Str.dedent(
      `
      sandbox:
        capability:
          read: []
          write: []
          env: {}
        context:
          append: [] # extra files loaded after ./AGENTS.md and ./SYSTEM.md
      `,
    ));
    expect(text).to.contain(Str.dedent(
      `
      tools:
        remove: { enabled: true, recursive: true }
        move: { enabled: true }
        copy: { enabled: true }
        ocr:
          pdf:
            enabled: false
            languages: [eng]
            defaultLanguage: eng
            dpi: 200
            maxPages: 10
            maxChars: 60000
            timeoutMs: 120000
      `,
    ));

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
