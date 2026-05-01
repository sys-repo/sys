import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { SettingsFs } from '../m.fs.ts';

describe(`@sys/driver-agent/pi/settings/m.fs`, () => {
  it('dirOf / pathOf → derive the git-rooted Pi agent settings location', () => {
    const cwd = '/tmp/pi-settings-test' as t.StringDir;
    expect(SettingsFs.dirOf(cwd)).to.eql('/tmp/pi-settings-test/.pi/agent');
    expect(SettingsFs.pathOf(cwd)).to.eql('/tmp/pi-settings-test/.pi/agent/settings.json');
  });

  it('write → materializes wrapper-owned startup settings under the Pi agent dir', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      const path = await SettingsFs.write({
        cwd,
        settings: { collapseChangelog: false },
      });

      expect(path).to.eql(Fs.join(cwd, '.pi', 'agent', 'settings.json'));

      const read = await Fs.readJson<t.JsonMap>(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql({
        quietStartup: true,
        collapseChangelog: false,
      });
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('write → preserves upstream Pi settings while refreshing wrapper-owned fields', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      const path = SettingsFs.pathOf(cwd);
      await Fs.writeJson(path, {
        lastChangelogVersion: '0.70.0',
        defaultProvider: 'openai-codex',
        defaultModel: 'gpt-5.5',
        collapseChangelog: false,
      });

      await SettingsFs.write({ cwd });

      const read = await Fs.readJson<t.JsonMap>(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql({
        lastChangelogVersion: '0.70.0',
        defaultProvider: 'openai-codex',
        defaultModel: 'gpt-5.5',
        collapseChangelog: true,
        quietStartup: true,
      });
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('write → rejects invalid existing agent settings instead of clobbering them', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      const path = SettingsFs.pathOf(cwd);
      await Fs.write(path, '[');

      let error = '';
      try {
        await SettingsFs.write({ cwd });
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      expect(error).to.contain('Cannot merge existing Pi settings');
      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('[');
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
