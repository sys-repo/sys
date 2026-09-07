import { describe, expect, it } from '../../../-test.ts';
import { Fs } from '../common.ts';
import { resolveExtensions, type ResolveExtensionsInput } from '../u/u.resolve.extensions.ts';
import { Sandbox } from '../../../m.core/m.extension/m.sandbox/mod.ts';

describe('@sys/driver-pi/cli/Profiles/extension resolution', () => {
  it('ZIP omission, empty policy, and enablement → one loader with matching tools and prompts', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.extensions.' })).absolute;
    try {
      for (const zip of [undefined, {}, { enabled: true }]) {
        const resolved = await resolveExtensions({ ...inputOf(cwd), zip });
        const path = Fs.join(cwd, '.pi/@sys/extensions/zip/mod.read.ts');
        expect(resolved.args).to.eql(['--extension', path]);
        expect(resolved.tools).to.eql(['zip_inspect', 'zip_test']);
        expect(resolved.promptArgs[0]).to.eql('--append-system-prompt');
        expect(resolved.promptArgs[1]).to.contain('- zip_inspect:');
        expect(resolved.promptArgs[1]).to.contain('- zip_test:');
        expect((await Fs.readText(path)).ok).to.eql(true);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('explicit opt-out → no ZIP loader, prompt, tool names, or materialization', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.extensions.' })).absolute;
    try {
      const result = await resolveExtensions({ ...inputOf(cwd), zip: { enabled: false } });
      expect(result).to.eql({ args: [], promptArgs: [], tools: [] });
      expect(await Fs.exists(Fs.join(cwd, '.pi'))).to.eql(false);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('extension-suppressed preview → no output or materialization, even with absent roots', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.extensions.' })).absolute;
    try {
      const absent = Fs.join(cwd, 'not-created');
      const input = inputOf(absent);
      const result = await resolveExtensions({ ...input, enabled: false, zip: { enabled: true } });
      expect(result).to.eql({ args: [], promptArgs: [], tools: [] });
      expect(await Fs.exists(absent)).to.eql(false);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('file and symlink read grants → do not block ZIP or broaden to parent directories', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.extensions.' })).absolute;
    const exactRoot = (await Fs.makeTempDir({ prefix: 'pi.extensions.files.' })).absolute;
    const directoryRoot = (await Fs.makeTempDir({ prefix: 'pi.extensions.directory.' })).absolute;
    const file = Fs.join(exactRoot, 'notes.txt');
    const alias = Fs.join(exactRoot, 'notes.alias');
    try {
      await Fs.write(file, 'notes', { throw: true });
      await Fs.ensureSymlink(file, alias);
      const sandboxFs = Sandbox.Fs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        read: [file, alias, directoryRoot],
        remove: { enabled: false },
        move: { enabled: false },
        copy: { enabled: false },
      });

      const resolved = await resolveExtensions({ ...inputOf(cwd), sandboxFs });
      expect(resolved.tools).to.eql(['zip_inspect', 'zip_test']);

      const generated = await Fs.readText(Fs.join(cwd, '.pi/@sys/extensions/zip/mod.read.ts'));
      expect(generated.data).to.contain(directoryRoot);
      expect(generated.data).not.to.contain(exactRoot);
      expect(generated.data).not.to.contain(file);
      expect(generated.data).not.to.contain(alias);
    } finally {
      await Fs.remove(cwd);
      await Fs.remove(exactRoot);
      await Fs.remove(directoryRoot);
    }
  });

  it('materialization → preserves unrelated extension files', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.extensions.' })).absolute;
    const foreign = Fs.join(cwd, '.pi/@sys/extensions/zip/foreign.ts');
    try {
      await Fs.write(foreign, 'foreign content', { throw: true });
      await resolveExtensions(inputOf(cwd));
      expect((await Fs.readText(foreign)).data).to.eql('foreign content');
      expect(await Fs.exists(Fs.join(cwd, '.pi/@sys/extensions/zip/mod.read.ts'))).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });
});

/** ZIP-only policy keeps these tests focused on the resolved extension state. */
function inputOf(cwd: string): ResolveExtensionsInput {
  return {
    cwd,
    enabled: true,
    sandboxFs: Sandbox.Fs.resolvePolicy({
      cwd: { invoked: cwd, git: cwd },
      remove: { enabled: false },
      move: { enabled: false },
      copy: { enabled: false },
    }),
  };
}
