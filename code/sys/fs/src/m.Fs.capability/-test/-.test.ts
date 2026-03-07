import { type t } from '../common.ts';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Fs } from '../../mod.ts';
import { FsCapability } from '../mod.ts';

describe(`FS: Capability`, () => {
  it('API', async () => {
    const m = await import('@sys/fs/capability');
    expect(m.FsCapability).to.equal(FsCapability);
  });

  it('fromFs', () => {
    const cap = FsCapability.fromFs(Fs);
    expectTypeOf(cap).toEqualTypeOf<t.FsCapability.Instance>();
    expect(cap.cwd).to.equal(Fs.cwd);
    expect(cap.resolve).to.equal(Fs.resolve);
    expect(cap.walk).to.equal(Fs.walk);
    expect(cap.remove).to.equal(Fs.remove);
    expect('tildeExpand' in cap).to.equal(false);
  });
});
