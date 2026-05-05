import { describe, expect, it } from '../../../-test.ts';
import { Fs, Str, type t } from '../common.ts';
import { ProfileMigrate } from '../u.migrate/mod.ts';
import { ProfilesFs } from '../u.fs.ts';

describe(`@sys/driver-pi/cli/Profiles/u.migrate`, () => {
  describe('01: context.include → context.append', () => {
    it('file → rewrites generated legacy context.include to context.append', async () => {
      const { cwd, path } = await writeProfile(
        Str.dedent(
          `
          prompt:
            system: null
          sandbox:
            capability:
              read: []
              write: []
              env: {}
            context:
              include: []
          `,
        ).trimStart(),
      );

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([{ from: path, to: path }]);
        expect(res.skipped).to.eql([]);

        const text = (await Fs.readText(path)).data ?? '';
        expect(text).to.contain('append: []');
        expect(text).not.to.contain('include:');

        const checked = await ProfilesFs.validateYaml(path);
        expect(checked.ok).to.eql(true);
        if (checked.ok) expect(checked.doc.sandbox?.context?.append).to.eql([]);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → is idempotent after rewrite', async () => {
      const { cwd, path } = await writeProfile('sandbox:\n  context:\n    include: []\n');

      try {
        expect((await ProfileMigrate.file(path)).migrated.length).to.eql(1);
        const second = await ProfileMigrate.file(path);
        expect(second.migrated).to.eql([]);
        expect(second.skipped).to.eql([{ from: path, to: path }]);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → preserves append when both legacy include and append exist', async () => {
      const { cwd, path } = await writeProfile(
        Str.dedent(
          `
          sandbox:
            context:
              include: [./legacy]
              append: [./current]
          `,
        ).trimStart(),
      );

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated.length).to.eql(1);

        const checked = await ProfilesFs.validateYaml(path);
        expect(checked.ok).to.eql(true);
        if (checked.ok) expect(checked.doc.sandbox?.context?.append).to.eql(['./current']);

        const text = (await Fs.readText(path)).data ?? '';
        expect(text).not.to.contain('include:');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → preserves an existing invalid append for schema validation', async () => {
      const { cwd, path } = await writeProfile(
        Str.dedent(
          `
          sandbox:
            context:
              include: []
              append: ./bad
          `,
        ).trimStart(),
      );

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated.length).to.eql(1);

        const text = (await Fs.readText(path)).data ?? '';
        expect(text).to.contain('append: ./bad');
        expect(text).not.to.contain('include:');
        expect((await ProfilesFs.validateYaml(path)).ok).to.eql(false);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → skips invalid YAML without clobbering it', async () => {
      const source = 'sandbox:\n  context:\n    include: [\n';
      const { cwd, path } = await writeProfile(source);

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([]);
        expect(res.skipped).to.eql([{ from: path, to: path }]);
        expect((await Fs.readText(path)).data).to.eql(source);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('dir → rewrites profiles in the configured profile directory', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const path = Fs.join(cwd, ProfilesFs.fileOf('default')) as t.StringPath;

      try {
        await Fs.ensureDir(Fs.dirname(path));
        await Fs.write(path, 'sandbox:\n  context:\n    include: []\n');

        const res = await ProfileMigrate.dir(cwd);
        expect(res.migrated).to.eql([{ from: path, to: path }]);
        expect((await Fs.readText(path)).data ?? '').to.contain('append: []');
      } finally {
        await Fs.remove(cwd);
      }
    });
  });

  describe('02: legacy profile dir → canonical profile dir', () => {
    it('dir → moves old profile directory to the canonical profile directory', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const oldPath = Fs.join(cwd, '-config/@sys.driver-pi.pi/default.yaml') as t.StringPath;
      const newPath = Fs.join(cwd, ProfilesFs.fileOf('default')) as t.StringPath;
      const source = 'sandbox:\n  capability:\n    read: [./canon]\n';

      try {
        await Fs.ensureDir(Fs.dirname(oldPath));
        await Fs.write(oldPath, source);

        const res = await ProfileMigrate.dir(cwd);
        expect(res.migrated).to.eql([
          { from: oldPath, to: newPath },
          { from: newPath, to: newPath },
        ]);
        expect(res.skipped).to.eql([]);
        expect(await Fs.exists(oldPath)).to.eql(false);
        const checked = await ProfilesFs.validateYaml(newPath);
        expect(checked.ok).to.eql(true);
        if (checked.ok) {
          expect(checked.doc.tools?.remove).to.eql({ enabled: false, recursive: true });
        }
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('dir → moves old driver-agent profile directory to the canonical profile directory', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const oldPath = Fs.join(cwd, '-config/@sys.driver-agent.pi/canon.yaml') as t.StringPath;
      const newPath = Fs.join(cwd, ProfilesFs.fileOf('canon')) as t.StringPath;
      const source = 'sandbox:\n  capability:\n    read: [./canon]\n';

      try {
        await Fs.ensureDir(Fs.dirname(oldPath));
        await Fs.write(oldPath, source);

        const res = await ProfileMigrate.dir(cwd);
        expect(res.migrated).to.eql([
          { from: oldPath, to: newPath },
          { from: newPath, to: newPath },
        ]);
        expect(res.skipped).to.eql([]);
        expect(await Fs.exists(Fs.dirname(oldPath))).to.eql(false);
        const checked = await ProfilesFs.validateYaml(newPath);
        expect(checked.ok).to.eql(true);
        if (checked.ok) {
          expect(checked.doc.tools?.remove).to.eql({ enabled: false, recursive: true });
        }
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('dir → removes empty old driver-agent profile scar when canonical dir exists', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const legacyDir = Fs.join(cwd, '-config/@sys.driver-agent.pi') as t.StringPath;
      const newPath = Fs.join(cwd, ProfilesFs.fileOf('default')) as t.StringPath;
      const source = profileWithRemoveDefaults('sandbox: {}');

      try {
        await Fs.ensureDir(legacyDir);
        await Fs.ensureDir(Fs.dirname(newPath));
        await Fs.write(newPath, source);

        const res = await ProfileMigrate.dir(cwd);
        expect(res.migrated).to.eql([]);
        expect(res.skipped).to.eql([]);
        expect(await Fs.exists(legacyDir)).to.eql(false);
        expect((await Fs.readText(newPath)).data).to.eql(source);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('dir → leaves new-only profile directory unchanged', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const path = Fs.join(cwd, ProfilesFs.fileOf('default')) as t.StringPath;
      const source = profileWithRemoveDefaults('sandbox: {}');

      try {
        await Fs.ensureDir(Fs.dirname(path));
        await Fs.write(path, source);

        const res = await ProfileMigrate.dir(cwd);
        expect(res.migrated).to.eql([]);
        expect(res.skipped).to.eql([]);
        expect((await Fs.readText(path)).data).to.eql(source);
      } finally {
        await Fs.remove(cwd);
      }
    });

    const conflictLegacyDirs = [
      '-config/@sys.driver-pi.pi',
      '-config/@sys.driver-agent.pi',
    ] as const;

    for (const legacyDir of conflictLegacyDirs) {
      it(`dir → refuses ${legacyDir} profile conflicts without clobbering`, async () => {
        const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
          .absolute as t.StringDir;
        const oldPath = Fs.join(cwd, legacyDir, 'default.yaml') as t.StringPath;
        const newPath = Fs.join(cwd, ProfilesFs.fileOf('default')) as t.StringPath;

        try {
          await Fs.ensureDir(Fs.dirname(oldPath));
          await Fs.ensureDir(Fs.dirname(newPath));
          await Fs.write(oldPath, 'sandbox:\n  capability:\n    read: [./old]\n');
          await Fs.write(newPath, 'sandbox:\n  capability:\n    read: [./new]\n');

          let error: Error | undefined;
          try {
            await ProfileMigrate.dir(cwd);
          } catch (err) {
            error = err as Error;
          }

          expect(error?.message).to.contain('would overwrite existing profile(s): default.yaml');
          expect(error?.message).to.contain(legacyDir);
          expect((await Fs.readText(oldPath)).data).to.contain('./old');
          expect((await Fs.readText(newPath)).data).to.contain('./new');
        } finally {
          await Fs.remove(cwd);
        }
      });
    }
  });

  describe('04: tools.remove disabled defaults', () => {
    it('file → adds disabled remove-tool defaults when tools is absent', async () => {
      const { cwd, path } = await writeProfile('sandbox:\n  capability:\n    write: [./src]\n');

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([{ from: path, to: path }]);
        expect(res.skipped).to.eql([]);

        const checked = await ProfilesFs.validateYaml(path);
        expect(checked.ok).to.eql(true);
        if (checked.ok) {
          expect(checked.doc.tools?.remove).to.eql({ enabled: false, recursive: true });
        }
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → preserves explicit remove enablement while adding missing defaults', async () => {
      const { cwd, path } = await writeProfile(
        Str.dedent(
          `
          tools:
            remove:
              enabled: true
          `,
        ).trimStart(),
      );

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([{ from: path, to: path }]);

        const checked = await ProfilesFs.validateYaml(path);
        expect(checked.ok).to.eql(true);
        if (checked.ok) {
          expect(checked.doc.tools?.remove).to.eql({ enabled: true, recursive: true });
        }
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → upgrades disabled legacy recursive false default to true', async () => {
      const { cwd, path } = await writeProfile(
        Str.dedent(
          `
          tools:
            remove:
              enabled: false
              recursive: false
          `,
        ).trimStart(),
      );

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([{ from: path, to: path }]);

        const checked = await ProfilesFs.validateYaml(path);
        expect(checked.ok).to.eql(true);
        if (checked.ok) {
          expect(checked.doc.tools?.remove).to.eql({ enabled: false, recursive: true });
        }
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → preserves enabled recursive false as an explicit policy', async () => {
      const { cwd, path } = await writeProfile(
        Str.dedent(
          `
          tools:
            remove:
              enabled: true
              recursive: false
          `,
        ).trimStart(),
      );

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([]);
        expect(res.skipped).to.eql([{ from: path, to: path }]);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → is idempotent after disabled defaults are present', async () => {
      const { cwd, path } = await writeProfile(profileWithRemoveDefaults('sandbox: {}'));

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([]);
        expect(res.skipped).to.eql([{ from: path, to: path }]);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('file → skips invalid tools shape without clobbering it', async () => {
      const source = 'tools: ./bad\n';
      const { cwd, path } = await writeProfile(source);

      try {
        const res = await ProfileMigrate.file(path);
        expect(res.migrated).to.eql([]);
        expect(res.skipped).to.eql([{ from: path, to: path }]);
        expect((await Fs.readText(path)).data).to.eql(source);
      } finally {
        await Fs.remove(cwd);
      }
    });
  });

  describe('03: legacy runtime logs → .pi/@sys/log', () => {
    it('dir → moves legacy sandbox logs to the canonical runtime log directory', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const oldLog = Fs.join(cwd, '.log/@sys.driver-pi/a.sandbox.log.md') as t.StringPath;
      const oldPiLog = Fs.join(
        cwd,
        '.log/@sys.driver-pi.pi/nested/b.sandbox.log.md',
      ) as t.StringPath;
      const newLog = Fs.join(
        cwd,
        '.pi/@sys/log/@sys.driver-pi/a.sandbox.log.md',
      ) as t.StringPath;
      const newPiLog = Fs.join(
        cwd,
        '.pi/@sys/log/@sys.driver-pi/nested/b.sandbox.log.md',
      ) as t.StringPath;

      try {
        await Fs.ensureDir(Fs.dirname(oldLog));
        await Fs.ensureDir(Fs.dirname(oldPiLog));
        await Fs.write(oldLog, '# old log\n');
        await Fs.write(oldPiLog, '# old pi log\n');

        const res = await ProfileMigrate.dir(cwd);
        expect(res.migrated).to.eql([
          { from: oldLog, to: newLog },
          { from: oldPiLog, to: newPiLog },
        ]);
        expect(res.skipped).to.eql([]);
        expect(await Fs.exists(oldLog)).to.eql(false);
        expect(await Fs.exists(oldPiLog)).to.eql(false);
        expect(await Fs.exists(Fs.join(cwd, '.log') as t.StringPath)).to.eql(false);
        expect((await Fs.readText(newLog)).data).to.eql('# old log\n');
        expect((await Fs.readText(newPiLog)).data).to.eql('# old pi log\n');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('dir → refuses legacy log conflicts without clobbering', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const oldLog = Fs.join(cwd, '.log/@sys.driver-pi/conflict.md') as t.StringPath;
      const newLog = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi/conflict.md') as t.StringPath;

      try {
        await Fs.ensureDir(Fs.dirname(oldLog));
        await Fs.ensureDir(Fs.dirname(newLog));
        await Fs.write(oldLog, 'old\n');
        await Fs.write(newLog, 'new\n');

        let error: Error | undefined;
        try {
          await ProfileMigrate.dir(cwd);
        } catch (err) {
          error = err as Error;
        }

        expect(error?.message).to.contain('Pi runtime log migration would overwrite existing file');
        expect((await Fs.readText(oldLog)).data).to.eql('old\n');
        expect((await Fs.readText(newLog)).data).to.eql('new\n');
      } finally {
        await Fs.remove(cwd);
      }
    });
  });
});

async function writeProfile(text: string) {
  const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
    .absolute as t.StringDir;
  const path = Fs.join(cwd, 'profile.yaml') as t.StringPath;
  await Fs.write(path, text);
  return { cwd, path };
}

function profileWithRemoveDefaults(prefix: string) {
  return Str.dedent(
    `
    ${prefix}
    tools:
      remove:
        enabled: false
        recursive: true
    `,
  ).trimStart();
}
