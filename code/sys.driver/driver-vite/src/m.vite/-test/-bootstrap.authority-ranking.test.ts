import { describe, expect, it } from '../../-test.ts';
import { authorityConflictFixture, bootstrapImportMap } from './u.bootstrap.fixture.ts';

describe('Bootstrap authority conflict world', () => {
  it('current startup authority prefers nearest mappings on direct conflicts', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.authority-conflict-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      const imports = delivery.data.imports as Record<string, string> | undefined;
      expect(imports?.['@shared/conflict']).to.eql('./child-conflict.ts');
      expect(imports?.['@child/only']).to.eql('./child-only.ts');
      expect(imports?.['@inline/child']).to.eql('./inline-child.ts');
    } finally {
      await delivery.dispose();
    }
  });

  it('current startup authority also carries root-only mappings through the same payload', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.authority-root-carry-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      const imports = delivery.data.imports as Record<string, string> | undefined;
      expect(imports?.['@root/only']).to.eql('./root-only.ts');
      expect(imports?.['@inline/root']).to.eql('./inline-root.ts');
      expect(imports?.['@child/only']).to.eql('./child-only.ts');
    } finally {
      await delivery.dispose();
    }
  });
});
