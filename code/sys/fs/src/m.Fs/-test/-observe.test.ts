import { describe, expect, it } from '../../-test.ts';
import { Fs } from '../mod.ts';
import * as Observe from '../../-exports/-observe.ts';

describe('@sys/fs/observe', () => {
  it('narrow entry → exposes the existing Fs observation identities only', () => {
    expect(Object.keys(Observe).sort()).to.eql(['lstat', 'realPath']);
    expect(Observe.lstat).to.equal(Fs.lstat);
    expect(Observe.realPath).to.equal(Fs.realPath);
  });

  it('missing and existing paths → preserves observation semantics without creating entries', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'fs.observe.' })).absolute;
    const absent = Fs.join(root, 'absent');
    try {
      expect(await Observe.lstat(absent)).to.eql(undefined);
      const info = await Observe.lstat(root);
      expect(info?.isDirectory).to.eql(true);
      expect(info?.isSymlink).to.eql(false);
      expect(await Observe.realPath(root)).to.eql(await Fs.realPath(root));
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
      expect((await Observe.lstat(link))?.isSymlink).to.eql(true);
      expect(await Observe.realPath(link)).to.eql(await Fs.realPath(target));
    } finally {
      await Fs.remove(root);
    }
  });
});
