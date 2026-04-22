import { describe, expect, it, Path } from '../../-test.ts';
import { relativeFromImportMap } from '../../-test/u.importMap.ts';
import { authorityConflictFixture, bootstrapImportMap } from './u.bootstrap.fixture.ts';

describe('Bootstrap payload world', () => {
  it('current delivery payload preserves non-import residue from both root and nearest documents', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.payload-residue-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      expect(delivery.data.xRootOnly).to.eql({ from: 'root' });
      expect(delivery.data.xChildOnly).to.eql({ from: 'child' });
    } finally {
      await delivery.dispose();
    }
  });

  it('current delivery payload overwrites duplicate top-level document fields shallowly from nearest authority', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.payload-scopes-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
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
