import { describe, expect, it } from '../../-test.ts';
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
        './child/': {
          '@scope/child': './scope-child.ts',
        },
      });
      expect(delivery.data.scopes).to.not.eql({
        './root/': {
          '@scope/root': './scope-root.ts',
        },
      });
    } finally {
      await delivery.dispose();
    }
  });
});
