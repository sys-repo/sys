import { describe, expect, it } from '../../../-test.ts';
import { Fs, Str } from '../common.ts';
import { migrate06 } from '../u.migrate/-06.ts';
import { ProfileMigrate } from '../u.migrate/mod.ts';
import { ProfileSchema } from '../u.schema/mod.ts';
import { ProfilesFs } from '../u/u.fs.ts';

describe('@sys/driver-pi/cli/Profiles/ZIP defaults', () => {
  it('migration → fills missing policy or enabled, preserves grants, and is idempotent', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.zip.defaults.' })).absolute;
    const path = Fs.join(cwd, 'profile.yaml');
    const sandbox = { capability: { read: ['./read'], write: ['./write'], env: { KEEP: 'yes' } } };
    try {
      for (const tools of [undefined, {}, { zip: {} }]) {
        await Fs.write(path, ProfileSchema.stringify({ sandbox, tools }), { throw: true });
        const first = await migrate06.file(path);
        expect(first.migrated).to.eql([{ from: path, to: path }]);
        const checked = await ProfilesFs.validateYaml(path);
        if (!checked.ok) throw new Error('Migrated profile must validate.');
        expect(checked.doc.tools?.zip).to.eql({ enabled: true });
        expect(checked.doc.sandbox).to.eql(sandbox);
        const text = (await Fs.readText(path)).data;
        expect((await migrate06.file(path)).migrated).to.eql([]);
        expect((await Fs.readText(path)).data).to.eql(text);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('migration → preserves explicit enablement and disablement byte-for-byte', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.zip.defaults.' })).absolute;
    const path = Fs.join(cwd, 'profile.yaml');
    try {
      for (const enabled of [true, false]) {
        const source = Str.dedent(`
          tools:
            zip:
              enabled: ${enabled} # deliberate policy
        `);
        await Fs.write(path, source, { throw: true });
        expect((await migrate06.file(path)).migrated).to.eql([]);
        expect((await Fs.readText(path)).data).to.eql(source);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('alias-resolved tools key → preserves effective mutation-tool opt-outs', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.zip.defaults.' })).absolute;
    const path = Fs.join(cwd, 'profile.yaml');
    const source = Str.dedent(
      `
      sandbox:
        capability:
          env:
            TOOLS_KEY: &key tools
      *key :
        remove: { enabled: false, recursive: true }
        move: { enabled: false }
        copy: { enabled: false }
      `,
    ).trimStart();
    try {
      await Fs.write(path, source, { throw: true });
      expect((await migrate06.file(path)).migrated).to.eql([]);
      expect((await Fs.readText(path)).data).to.eql(source);

      for (let attempt = 0; attempt < 2; attempt += 1) {
        expect((await ProfileMigrate.file(path)).migrated).to.eql([]);
        expect((await Fs.readText(path)).data).to.eql(source);
      }

      const checked = await ProfilesFs.validateYaml(path);
      if (!checked.ok) throw new Error('Aliased tools profile must remain valid.');
      expect(checked.doc.tools).to.eql({
        remove: { enabled: false, recursive: true },
        move: { enabled: false },
        copy: { enabled: false },
      });
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('alias-valued ZIP policy → skips unsupported mutation and remains idempotent', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.zip.defaults.' })).absolute;
    const path = Fs.join(cwd, 'profile.yaml');
    const source = Str.dedent(
      `
      sandbox: &empty {}
      tools:
        remove: { enabled: false, recursive: true }
        move: { enabled: false }
        copy: { enabled: false }
        zip: *empty
      `,
    ).trimStart();
    try {
      await Fs.write(path, source, { throw: true });
      expect((await migrate06.file(path)).migrated).to.eql([]);
      expect((await Fs.readText(path)).data).to.eql(source);

      for (let attempt = 0; attempt < 2; attempt += 1) {
        expect((await ProfileMigrate.file(path)).migrated).to.eql([]);
        expect((await Fs.readText(path)).data).to.eql(source);
      }

      const checked = await ProfilesFs.validateYaml(path);
      if (!checked.ok) throw new Error('Aliased ZIP profile must remain valid.');
      expect(checked.doc.tools?.zip).to.eql({});
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('malformed policy → stays invalid rather than being normalized into enablement', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.zip.defaults.' })).absolute;
    const path = Fs.join(cwd, 'profile.yaml');
    try {
      const policies = [
        'tools: null',
        'tools: []',
        'tools: { zip: null }',
        'tools: { zip: [] }',
        'tools: { zip: { enabled: "false" } }',
        'tools: { zip: { extract: true } }',
      ];
      for (const source of policies) {
        await Fs.write(path, source, { throw: true });
        expect((await migrate06.file(path)).migrated).to.eql([]);
        expect((await Fs.readText(path)).data).to.eql(source);
        expect((await ProfilesFs.validateYaml(path)).ok).to.eql(false);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });
});
