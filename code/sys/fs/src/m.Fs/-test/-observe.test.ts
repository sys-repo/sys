import { describe, expect, it } from '../../-test.ts';
import { Fs } from '../mod.ts';
import { lstat, realPath } from '@sys/fs/observe';

describe('@sys/fs/observe', () => {
  it('public entry → preserves the existing Fs observation identities', () => {
    expect(lstat).to.equal(Fs.lstat);
    expect(realPath).to.equal(Fs.realPath);
  });

  it('missing and existing paths → preserves observation semantics without creating entries', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'fs.observe.' })).absolute;
    const absent = Fs.join(root, 'absent');
    try {
      expect(await lstat(absent)).to.eql(undefined);
      const info = await lstat(root);
      expect(info?.isDirectory).to.eql(true);
      expect(info?.isSymlink).to.eql(false);
      expect(await realPath(root)).to.eql(await Fs.realPath(root));
      const url = Fs.Path.toFileUrl(root);
      expect((await lstat(url))?.isDirectory).to.eql(true);
      expect((await lstat(Fs.Path.relative(Fs.cwd(), root)))?.isDirectory).to.eql(true);
      expect(await Fs.exists(absent)).to.eql(false);
    } finally {
      await Fs.remove(root);
    }
  });

  it('final symlink → observes the link while realPath resolves its target', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'fs.observe.link.' })).absolute;
    const target = Fs.join(root, 'target');
    const link = Fs.join(root, 'alias');
    try {
      await Fs.ensureDir(target);
      await Fs.ensureSymlink(target, link);
      expect((await lstat(link))?.isSymlink).to.eql(true);
      expect(await realPath(link)).to.eql(await Fs.realPath(target));
    } finally {
      await Fs.remove(root);
    }
  });
});
