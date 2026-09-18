import { describe, expect, expectTypeOf, Hash, it, StdPath, type t } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { fixturePart, setup, teardown } from './-u.pinned.fixture.ts';

describe('Pkg.Dist.Pinned.readPart', () => {
  it('returns only bytes matching the exact part authority', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const expected = await Deno.readFile(StdPath.join(fixture.dir, part.path));
      const result = await Pkg.Dist.Pinned.readPart(part);

      expectTypeOf(result).toEqualTypeOf<t.Pkg.Dist.Pinned.ReadPart.Result>();
      expect(result.kind).to.eql('read');
      if (result.kind !== 'read') return;

      expect(result.bytes).to.eql(expected);
      expect(Object.isFrozen(result)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('reads an exact zero-byte part', async () => {
    const fixture = await setup();
    try {
      const path = 'empty.txt';
      const bytes = new Uint8Array();
      await Deno.writeFile(StdPath.join(fixture.dir, path), bytes);

      const result = await Pkg.Dist.Pinned.readPart({
        dir: fixture.dir,
        path,
        checksum: Hash.sha256(bytes),
        size: 0,
      });
      expect(result).to.eql({ kind: 'read', bytes });
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed for missing, wrong-sized, and checksum-mismatched parts', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const missing = await Pkg.Dist.Pinned.readPart({
        dir: fixture.dir,
        path: 'missing.js',
        checksum: part.checksum,
        size: part.size,
      });
      expect(missing).to.eql({ kind: 'missing' });

      const nonFile = await Pkg.Dist.Pinned.readPart({
        dir: fixture.dir,
        path: 'assets',
        checksum: part.checksum,
        size: part.size,
      });
      expect(nonFile).to.eql({ kind: 'content-mismatch' });

      const short = await Pkg.Dist.Pinned.readPart({
        ...part,
        size: part.size - 1,
      });
      expect(short).to.eql({ kind: 'content-mismatch' });

      const grown = await Pkg.Dist.Pinned.readPart({
        ...part,
        size: part.size + 1,
      });
      expect(grown).to.eql({ kind: 'content-mismatch' });

      const checksum = await Pkg.Dist.Pinned.readPart({
        ...part,
        checksum: Hash.sha256('wrong'),
      });
      expect(checksum).to.eql({ kind: 'content-mismatch' });
    } finally {
      await teardown(fixture);
    }
  });
});
