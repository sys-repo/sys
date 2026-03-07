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

  describe('File.migrateDir', () => {
    it('migrateDir: moves zY AML files and removes empty source', async () => {
      const tmp = await Fs.makeTempDir();
      try {
        const from = Fs.join(tmp.absolute, 'from');
        const to = Fs.join(tmp.absolute, 'to');
        await Fs.ensureDir(from);
        await Fs.write(Fs.join(from, 'alpha.yaml'), 'alpha: 1\n');

        const res = await File.migrateDir({
          cwd: tmp.absolute,
          from: 'from',
          to: 'to',
        });

        expect(res.migrated.length).to.eql(1);
        expect(res.skipped.length).to.eql(0);
        expect(await Fs.exists(Fs.join(to, 'alpha.yaml'))).to.eql(true);
        expect(await Fs.exists(from)).to.eql(false);
      } finally {
        await Fs.remove(tmp.absolute);
      }
    });
  });
});
