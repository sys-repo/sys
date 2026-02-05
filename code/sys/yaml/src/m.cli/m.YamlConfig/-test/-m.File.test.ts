import { describe, expect, it } from '../../../-test.ts';
import { type t, Fs, Pkg } from '../common.ts';
import { File } from '../m.File.ts';

describe('YamlConfig.File', () => {
  describe('File.create', () => {
    it('create: builds a root dir', () => {
      const res = File.create({
        dir: '/tmp' as t.StringDir,
        basename: '@scope.foo' as t.StringName,
      });
      expect(res.dir.name).to.eql('@scope.foo');
      expect(res.dir.path).to.eql(Fs.join('/tmp', '@scope.foo'));
    });
  });

  describe('File.fromPkg', () => {
    it('fromPkg: flattens scoped pkg name', () => {
      const pkg = Pkg.fromJson({ name: '@scope/foo', version: '1.2.3' });
      const res = File.fromPkg('-config' as t.StringDir, pkg);
      expect(res.dir.name).to.eql('@scope.foo');
      expect(res.dir.path).to.eql(Fs.join('-config', '@scope.foo'));
    });

    it('fromPkg: rejects unknown or invalid names', () => {
      const unknown = Pkg.fromJson({ name: '<unknown>', version: '0.0.0' });
      expect(() => File.fromPkg('-config' as t.StringDir, unknown)).to.throw(Error);

      const invalid = Pkg.fromJson({ name: '@scope/foo bar', version: '1.0.0' });
      expect(() => File.fromPkg('-config' as t.StringDir, invalid)).to.throw(Error);
    });

    it('fromPkg: collapses extra slashes', () => {
      const pkg = Pkg.fromJson({ name: '@scope////foo', version: '1.0.0' });
      const res = File.fromPkg('-config' as t.StringDir, pkg);
      expect(res.dir.name).to.eql('@scope.foo');
    });
  });
});
