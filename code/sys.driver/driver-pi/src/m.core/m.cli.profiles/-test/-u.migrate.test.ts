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
        expect(res.migrated).to.eql([{ from: oldPath, to: newPath }]);
        expect(res.skipped).to.eql([]);
        expect(await Fs.exists(oldPath)).to.eql(false);
        expect((await Fs.readText(newPath)).data).to.eql(source);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('dir → leaves new-only profile directory unchanged', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const path = Fs.join(cwd, ProfilesFs.fileOf('default')) as t.StringPath;
      const source = 'sandbox: {}\n';

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

    it('dir → refuses old/new profile conflicts without clobbering', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.migrate.test.' }))
        .absolute as t.StringDir;
      const oldPath = Fs.join(cwd, '-config/@sys.driver-pi.pi/default.yaml') as t.StringPath;
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
        expect((await Fs.readText(oldPath)).data).to.contain('./old');
        expect((await Fs.readText(newPath)).data).to.contain('./new');
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
