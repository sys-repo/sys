import { type t } from '../common.ts';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Fs } from '../../mod.ts';
import { FsCapability } from '../mod.ts';

describe(`FS: Capability`, () => {
  it('API', async () => {
    const m = await import('@sys/fs/capability');
    expect(m.FsCapability).to.equal(FsCapability);
  });

  describe('adapter surfaces', () => {
    it('fromFs', () => {
      const cap = FsCapability.fromFs(Fs);
      expectTypeOf(cap).toEqualTypeOf<t.FsCapability.Instance>();
      expect(cap.cwd).to.equal(Fs.cwd);
      expect(cap.resolve).to.equal(Fs.resolve);
      expect(cap.walk).to.equal(Fs.walk);
      expect(cap.remove).to.equal(Fs.remove);
      expect('tildeExpand' in cap).to.eql(false);
    });

    it('Files adapters', () => {
      expect(FsCapability.Files).to.equal(Fs.Capability.Files);
      expect(Object.keys(FsCapability.Files).sort()).to.eql(['Readonly', 'Writable']);
      expect(Object.keys(FsCapability.Files.Readonly).sort()).to.eql(['create', 'live']);
      expect(Object.keys(FsCapability.Files.Writable).sort()).to.eql(['create', 'live']);
      expect(FsCapability.Files.Readonly.create).to.equal(Fs.Capability.Files.Readonly.create);
      expect(FsCapability.Files.Readonly.live).to.equal(Fs.Capability.Files.Readonly.live);
      expect(FsCapability.Files.Writable.create).to.equal(Fs.Capability.Files.Writable.create);
      expect(FsCapability.Files.Writable.live).to.equal(Fs.Capability.Files.Writable.live);
      expectTypeOf(FsCapability.Files).toEqualTypeOf<t.FsCapability.Files.Lib>();
      expect('toReadonly' in FsCapability.Files).to.eql(false);
      expect('toLive' in FsCapability.Files).to.eql(false);
      expect('toWritable' in FsCapability.Files).to.eql(false);
      expect('toLiveWritable' in FsCapability.Files).to.eql(false);
      expect('toFilesFsReadonly' in FsCapability).to.eql(false);
    });

    it('Rooted capability', () => {
      expect(FsCapability.Rooted).to.equal(Fs.Capability.Rooted);
      expectTypeOf(FsCapability.Rooted).toEqualTypeOf<t.FsRooted.Lib>();
    });
  });
});
