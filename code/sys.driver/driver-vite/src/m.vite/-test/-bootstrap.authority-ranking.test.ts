import { describe, expect, it, Path } from '../../-test.ts';
import { authorityConflictFixture, bootstrapImportMap } from './u.bootstrap.fixture.ts';

describe('Bootstrap authority conflict world', () => {
  it('ranked startup authority prefers nearest mappings on direct conflicts', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.authority-conflict-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      const imports = delivery.data.imports as Record<string, string> | undefined;
      expect(delivery.resolve(imports?.['@shared/conflict'])).to.eql(
        Path.toFileUrl(Path.join(ctx.child, 'child-conflict.ts')).href,
      );
      expect(delivery.resolve(imports?.['@child/only'])).to.eql(
        Path.toFileUrl(Path.join(ctx.child, 'child-only.ts')).href,
      );
      expect(delivery.resolve(imports?.['@inline/child'])).to.eql(
        Path.toFileUrl(Path.join(ctx.child, 'inline-child.ts')).href,
      );
    } finally {
      await delivery.dispose();
    }
  });

  it('ranked startup authority excludes broader root-only mappings when nearer consumer truth exists', async () => {
    const ctx = await authorityConflictFixture('vite.bootstrap.authority-root-carry-');
    const delivery = await bootstrapImportMap(ctx.paths);

    try {
      const imports = delivery.data.imports as Record<string, string> | undefined;
      expect(imports?.['@root/only']).to.eql(undefined);
      expect(imports?.['@inline/root']).to.eql(undefined);
      expect(delivery.resolve(imports?.['@root/only'])).to.eql('');
      expect(delivery.resolve(imports?.['@inline/root'])).to.eql('');
      expect(delivery.resolve(imports?.['@child/only'])).to.eql(
        Path.toFileUrl(Path.join(ctx.child, 'child-only.ts')).href,
      );
      expect(delivery.resolve(imports?.['@inline/child'])).to.eql(
        Path.toFileUrl(Path.join(ctx.child, 'inline-child.ts')).href,
      );
    } finally {
      await delivery.dispose();
    }
  });
});
