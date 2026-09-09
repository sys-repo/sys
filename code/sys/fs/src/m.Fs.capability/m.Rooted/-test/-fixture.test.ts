import { describe, expect, Fs, it, setup, teardown } from './u.fixture.ts';
import { readMode } from './u.fixture.tree.ts';

const parent = Fs.Path.fromFileUrl(new URL('../../../../.tmp/fs-rooted/', import.meta.url));

describe('Fs.Capability.Rooted test fixture lifecycle', () => {
  it('allocates package-local isolated workspaces → removes only its own workspace', async () => {
    const a = await setup();
    const b = await setup();
    try {
      expect(Fs.dirname(a.workspace)).to.eql(Fs.resolve(parent));
      expect(Fs.basename(a.workspace).startsWith('fs-')).to.eql(true);
      expect(a.workspace === b.workspace).to.eql(false);
      const keep = Fs.join(b.workspace, 'keep');
      await Deno.writeTextFile(keep, 'keep');
      await teardown(a);
      expect(await Fs.lstat(a.workspace)).to.eql(undefined);
      expect(await Deno.readTextFile(keep)).to.eql('keep');
      await teardown(a);
    } finally {
      await teardown(a);
      await teardown(b);
    }
  });

  it('anchors allocation to the package even when the caller changes CWD', async () => {
    const caller = await setup();
    const cwd = Deno.cwd();
    try {
      Deno.chdir(caller.workspace);
      const fixture = await setup();
      try {
        expect(Fs.dirname(fixture.workspace)).to.eql(Fs.resolve(parent));
      } finally {
        await teardown(fixture);
      }
    } finally {
      Deno.chdir(cwd);
      await teardown(caller);
    }
  });

  it({
    name: 'removes sealed directories without following symlinks or changing linked files',
    ignore: Deno.build.os === 'windows', // POSIX modes and unprivileged symlink creation.
    async fn() {
      const fixture = await setup();
      const external = await setup();
      const result = Fs.join(fixture.root, 'result');
      const nested = Fs.join(result, 'nested');
      const keep = Fs.join(external.workspace, 'keep');
      try {
        await Deno.mkdir(nested, { recursive: true });
        await Deno.writeTextFile(keep, 'keep');
        await Deno.chmod(keep, 0o400);
        await Deno.link(keep, Fs.join(nested, 'file'));
        await Deno.symlink(external.workspace, Fs.join(result, 'external'));
        await Deno.symlink(Fs.join(external.workspace, 'missing'), Fs.join(result, 'dangling'));
        await Deno.chmod(external.workspace, 0o500);
        await Deno.chmod(nested, 0o500);
        await Deno.chmod(result, 0o500);
        await teardown(fixture);
        expect(await Fs.lstat(fixture.workspace)).to.eql(undefined);
        expect(await Deno.readTextFile(keep)).to.eql('keep');
        expect((await readMode(keep)) & 0o777).to.eql(0o400);
        expect((await readMode(external.workspace)) & 0o777).to.eql(0o500);
      } finally {
        // Leave no sealed residue if the cleanup regression fails.
        if (await Fs.exists(result)) await Deno.chmod(result, 0o700);
        if (await Fs.exists(nested)) await Deno.chmod(nested, 0o700);
        if (await Fs.exists(external.workspace)) await Deno.chmod(external.workspace, 0o700);
        await teardown(fixture);
        await teardown(external);
      }
    },
  });

  it('surfaces unexpected filesystem errors instead of claiming cleanup succeeded', async () => {
    const fixture = await setup();
    const file = Fs.join(fixture.workspace, 'file');
    try {
      await Deno.writeTextFile(file, 'not a directory');
      let failure: unknown;
      try {
        await teardown({ ...fixture, workspace: Fs.join(file, 'child') });
      } catch (error) {
        failure = error;
      }
      expect(failure instanceof Deno.errors.NotADirectory).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});
