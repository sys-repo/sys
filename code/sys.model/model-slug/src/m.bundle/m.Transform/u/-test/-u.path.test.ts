import { describe, expect, it } from '../../../../-test.ts';
import {
  basename,
  isAbsolutePath,
  joinPath,
  relativePath,
  resolvePath,
  toRawPath,
  toRelativeDir,
} from '../u.path.ts';

describe('u.path', () => {
  it('joinPath preserves relative formatting segments used by policy inputs', () => {
    expect(joinPath('/program', '-manifests', 'slug.a.assets.json')).to.equal(
      '/program/-manifests/slug.a.assets.json',
    );
    expect(joinPath('/video/program', './shard.<shard>/', 'x.webm')).to.equal(
      '/video/program/./shard.<shard>/x.webm',
    );
  });

  it('resolvePath joins base + subpath + filename with absolute passthrough rules', () => {
    expect(resolvePath('/program', '-manifests', 'a.json')).to.equal('/program/-manifests/a.json');
    expect(resolvePath('/program', '/abs', 'a.json')).to.equal('/abs/a.json');
    expect(resolvePath('/program', '-manifests', '/tmp/a.json')).to.equal('/tmp/a.json');
  });

  it('toRawPath and toRelativeDir preserve descriptor-facing relative semantics', () => {
    expect(toRawPath('/program', '/program/-manifests/a.json')).to.equal('-manifests/a.json');
    expect(toRawPath('/program', '/program')).to.equal('program');
    expect(toRelativeDir('/program', '/program/image')).to.equal('image');
    expect(toRelativeDir('/program', './shard.<shard>/')).to.equal('./shard.<shard>/');
    expect(toRawPath('/program', '/other/manifests/a.json')).to.equal('../other/manifests/a.json');
    expect(toRelativeDir('/program', '/other/image')).to.equal('../other/image');
  });

  it('absolute/relative/basename helpers behave on common inputs', () => {
    expect(isAbsolutePath('/a/b')).to.equal(true);
    expect(isAbsolutePath('C:\\a\\b')).to.equal(true);
    expect(isAbsolutePath('./a/b')).to.equal(false);
    expect(relativePath('/a', '/a/b/c')).to.equal('b/c');
    expect(relativePath('/a', '/b/c')).to.equal('../b/c');
    expect(basename('/a/b/c.txt')).to.equal('c.txt');
    expect(basename('C:\\a\\b\\c.txt')).to.equal('c.txt');
  });
});
