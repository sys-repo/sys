import { describe, expect, it } from '../../../-test.ts';
import { type t, Fs, Pkg } from '../common.ts';
import { File } from '../m.File.ts';

describe('YamlConfig.File', () => {
  it('create: builds a root dir', () => {
    const res = File.create({ dir: '/tmp' as t.StringDir, basename: '@scope.foo' as t.StringName });
    expect(res.dir.name).to.eql('@scope.foo');
    expect(res.dir.path).to.eql(Fs.join('/tmp', '@scope.foo'));
  });

  it('fromPkg: flattens scoped pkg name', () => {
    const pkg = Pkg.fromJson({ name: '@scope/foo', version: '1.2.3' });
    const res = File.fromPkg('-config' as t.StringDir, pkg);
    expect(res.dir.name).to.eql('@scope.foo');
    expect(res.dir.path).to.eql(Fs.join('-config', '@scope.foo'));
  });
});
