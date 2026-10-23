import deno from '../../deno.json' with { type: 'json' };
import { cleanSample } from '../task.clean.ts';
import { describe, expect, expectError, Fs, it, Obj } from './common.ts';
import { localFixture } from './u.fixture.ts';

const generated = [
  'dist.pins.json',
  'dist.selection.json',
  'dist',
  'dist.private',
  'dist.public',
  '.tmp',
];

describe('R2 deployment sample: local clean', () => {
  it('task wiring → uses the local entrypoint without network or subprocess grants', () => {
    expect(deno.tasks.clean).to.eql('deno run --no-prompt -P=clean ./-scripts/task.clean.ts');
    expect(deno.permissions.clean).to.eql({ read: true, write: true, env: true });
  });

  it('built sample → removes every generated artifact, preserves inputs, and tolerates repeat runs', async () => {
    await using f = await localFixture();
    await Fs.write(f.dir.join('dist.selection.json'), 'legacy record', { throw: true });
    await Fs.write(f.dir.join('.tmp/nested/keep-until-clean.txt'), 'temporary', { throw: true });
    const preserved = {
      'src/keep.ts': 'export {};',
      'deno.json': '{}',
      'r2.config.json': 'intentionally invalid configuration',
      '.env': 'fixture credentials stay local',
      '.sys.rooted/keep.txt': 'lease metadata is not a build output',
      'dist.unrelated.json': 'not a generated artifact',
    };
    for (const [path, text] of Obj.entries(preserved)) {
      await Fs.write(f.dir.join(path), text, { throw: true });
    }
    for (const path of generated) expect(await Fs.exists(f.dir.join(path)), path).to.eql(true);

    for (const run of ['first', 'repeat']) {
      await cleanSample(f.dir.absolute);

      for (const path of generated) {
        expect(await Fs.lstat(f.dir.join(path)), `${run} clean: ${path}`).to.eql(undefined);
      }
      for (const [path, text] of Obj.entries(preserved)) {
        expect((await Fs.readText(f.dir.join(path))).data, `${run} clean: ${path}`).to.eql(text);
      }
    }
  });

  it('removal failure → stops at the failed path and invalidates records before deleting outputs', async () => {
    for (const filename of ['dist.pins.json', 'dist.selection.json', 'dist.private']) {
      await using f = await localFixture();
      await Fs.write(f.dir.join('dist.selection.json'), 'legacy record', { throw: true });
      await Fs.write(f.dir.join('.tmp/keep-until-clean.txt'), 'temporary', { throw: true });
      const target = f.dir.join(filename);
      const failure = new Error(`Fixture removal failed: ${filename}`);
      const calls: (string | URL)[] = [];
      const remove = Deno.remove;
      // Only the host deletion fails; path checks and all other filesystem work remain real.
      Deno.remove = (path, options) => {
        calls.push(path);
        return path === target ? Promise.reject(failure) : remove(path, options);
      };
      try {
        const error = await expectError(() => cleanSample(f.dir.absolute));
        expect(error).to.equal(failure);
      } finally {
        Deno.remove = remove;
      }

      const index = generated.indexOf(filename);
      expect(calls).to.eql(generated.slice(0, index + 1).map((path) => f.dir.join(path)));
      for (const path of generated.slice(0, index)) {
        expect(await Fs.lstat(f.dir.join(path)), path).to.eql(undefined);
      }
      for (const path of generated.slice(index)) {
        expect(await Fs.exists(f.dir.join(path)), path).to.eql(true);
      }
    }
  });

  it('output symlinks → removes links, including dangling links, without deleting their targets', async () => {
    await using f = await localFixture();
    const targetDir = f.dir.join('unrelated');
    await Fs.write(Fs.join(targetDir, 'keep.txt'), 'preserved target', { throw: true });
    await Fs.remove(f.dir.join('dist.public'));
    await Fs.remove(f.dir.join('dist.private'));
    await Deno.symlink(targetDir, f.dir.join('dist.public'), { type: 'dir' });
    await Deno.symlink(f.dir.join('missing'), f.dir.join('dist.private'), { type: 'dir' });

    await cleanSample(f.dir.absolute);

    expect(await Fs.lstat(f.dir.join('dist.public'))).to.eql(undefined);
    expect(await Fs.lstat(f.dir.join('dist.private'))).to.eql(undefined);
    expect((await Fs.readText(Fs.join(targetDir, 'keep.txt'))).data).to.eql('preserved target');
  });
});
