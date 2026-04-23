import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { SettingsFs } from '../m.fs.ts';

describe(`@sys/driver-agent/pi/settings/m.fs`, () => {
  it('dirOf / pathOf → derive the project-local pi settings location', () => {
    const cwd = '/tmp/pi-settings-test' as t.StringDir;
    expect(SettingsFs.dirOf(cwd)).to.eql('/tmp/pi-settings-test/.pi');
    expect(SettingsFs.pathOf(cwd)).to.eql('/tmp/pi-settings-test/.pi/settings.json');
  });

  it('write → materializes canonical wrapper-owned settings under .pi/settings.json', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      const path = await SettingsFs.write({
        cwd,
        settings: { collapseChangelog: false },
      });

      expect(path).to.eql(Fs.join(cwd, '.pi', 'settings.json'));

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('{\n  "quietStartup": true,\n  "collapseChangelog": false\n}\n');
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
