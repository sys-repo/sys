import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { MenuState } from '../u/u.menu.state.ts';

describe(`@sys/driver-pi/cli/Profiles/u.menu-state`, () => {
  it('readMode → returns stored launch preference when state file is valid', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;
    try {
      const path = MenuState.pathOf(root);
      const wrote = await MenuState.writeMode({ root, selectedMode: 'ui' });
      expect(wrote).to.eql(true);

      const read = await MenuState.readMode(root);
      expect(read).to.eql('ui');
      expect(path).to.contain('/.pi/@sys/state/');
      expect(path).to.contain('/menu.json');

      const loaded = await Fs.readJson<t.PiCliProfiles.MenuState>(path);
      expect(loaded.ok).to.eql(true);
      expect(loaded.data?.selectedMode).to.eql('ui');
      expect(loaded.data?.['.meta']?.schemaVersion).to.eql(1);
      expect(typeof loaded.data?.['.meta']?.modifiedAt).to.eql('number');
    } finally {
      await Fs.remove(root);
    }
  });

  it('readMode → falls back to start:cli when state file is missing', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;

    try {
      const read = await MenuState.readMode(root);
      expect(read).to.eql('cli');
    } finally {
      await Fs.remove(root);
    }
  });

  it('readMode → falls back to start:cli when state file is invalid', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;
    const path = MenuState.pathOf(root);

    try {
      await Fs.write(path, '{ invalid json }');
      const read = await MenuState.readMode(root);
      expect(read).to.eql('cli');
    } finally {
      await Fs.remove(root);
    }
  });

  it('readMode → falls back to start:cli when schemaVersion is unsupported', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;
    const path = MenuState.pathOf(root);

    try {
      await Fs.writeJson(path, {
        selectedMode: 'ui',
        '.meta': {
          createdAt: 1_700_000_000,
          schemaVersion: 99,
        },
      });
      const read = await MenuState.readMode(root);
      expect(read).to.eql('cli');
    } finally {
      await Fs.remove(root);
    }
  });

  it('writeMode → overwrites non-conforming state on write', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;
    const path = MenuState.pathOf(root);

    try {
      await Fs.writeJson(path, {
        selectedMode: 'ui',
        '.meta': {
          createdAt: 1_700_000_000,
          schemaVersion: 99,
        },
        extra: 'value',
      });
      const wrote = await MenuState.writeMode({ root, selectedMode: 'ui' });
      expect(wrote).to.eql(true);

      const loaded = await Fs.readJson<t.PiCliProfiles.MenuState>(path);
      expect(loaded.ok).to.eql(true);
      expect(loaded.data?.selectedMode).to.eql('ui');
      expect(Object.keys(loaded.data ?? {}).length).to.eql(2);
      expect(loaded.data?.['.meta']?.schemaVersion).to.eql(1);
    } finally {
      await Fs.remove(root);
    }
  });

  it('writeMode → rewrites array state before write', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;
    const path = MenuState.pathOf(root);

    try {
      await Fs.write(path, JSON.stringify([1, 2, 3]));
      const wrote = await MenuState.writeMode({ root, selectedMode: 'cli' });
      expect(wrote).to.eql(true);

      const read = await MenuState.readMode(root);
      expect(read).to.eql('cli');

      const loaded = await Fs.readJson<t.PiCliProfiles.MenuState>(path);
      expect(loaded.ok).to.eql(true);
      expect(loaded.data?.selectedMode).to.eql('cli');
      expect(Object.keys(loaded.data ?? {}).length).to.eql(2);
    } finally {
      await Fs.remove(root);
    }
  });

  it('readMode → falls back to start:cli when state has unexpected keys', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu-state.test.' }))
      .absolute as t.StringDir;
    const path = MenuState.pathOf(root);

    try {
      await Fs.writeJson(path, {
        selectedMode: 'ui',
        '.meta': {
          createdAt: 1_700_000_000,
          schemaVersion: 1,
        },
        extra: 'value',
      });
      const read = await MenuState.readMode(root);
      expect(read).to.eql('cli');
    } finally {
      await Fs.remove(root);
    }
  });
});
