import { describe, expect, it, Path } from '../../-test.ts';
import { relativeFromImportMap } from '../../-test/u.importMap.ts';
import { authorityConflictFixture, bootstrapImportMap } from './u.bootstrap.fixture.ts';

describe('Bootstrap payload world', () => {
  it('startup payload now excludes broad top-level document residue', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.payload-residue-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      expect(Object.keys(delivery.data).sort()).to.eql(['imports', 'scopes']);
      expect(delivery.data.xRootOnly).to.eql(undefined);
      expect(delivery.data.xChildOnly).to.eql(undefined);
    } finally {
      await delivery.dispose();
    }
  });

  it('startup payload keeps only the explicit startup authority that still matters', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.payload-scopes-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      expect(Object.keys(delivery.data).sort()).to.eql(['imports', 'scopes']);
      expect(delivery.data.scopes).to.eql({
        [relativeFromImportMap(delivery.path, Path.join(ctx.child, 'child'), true)]: {
          '@scope/child': relativeFromImportMap(delivery.path, Path.join(ctx.child, 'scope-child.ts')),
        },
      });
      expect(delivery.data.scopes).to.not.eql({
        [relativeFromImportMap(delivery.path, Path.join(ctx.child, 'root'), true)]: {
          '@scope/root': relativeFromImportMap(delivery.path, Path.join(ctx.child, 'scope-root.ts')),
        },
      });
    } finally {
      await delivery.dispose();
    }
  });
});
