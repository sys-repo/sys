import { describe, EsmAssert, it, Path } from './common.ts';

const root = Path.resolve(import.meta.dirname!, '../..');

/** Local runtime graph proof; external packages' transitive graphs are not traversed. */
describe('crypto curves import boundary', () => {
  const entries = ['mod.ts', 'm.Sign/mod.ts', 'm.Sign.Ed25519/mod.ts'];
  for (const entry of entries) {
    it(`${entry} → no curve-validation dependency`, async () => {
      await EsmAssert.runtimeGraphBoundary({
        entry: Path.join(root, entry),
        forbiddenImports: ['@noble/curves', '@sys/crypto/curves'],
        forbiddenPathIncludes: ['/m.Curves/'],
      });
    });
  }

  it('curves leaf → owns the public vendor seam, without signing or passkey imports', async () => {
    const entry = Path.join(root, 'm.Curves/mod.ts');
    await EsmAssert.runtimeGraphOwnership({
      entry,
      ownedImports: ['@noble/curves/ed25519.js'],
    });
    await EsmAssert.runtimeGraphBoundary({
      entry,
      forbiddenImports: ['@simplewebauthn/server', '@sys/ui', 'node:crypto'],
      forbiddenPathIncludes: ['/m.Sign', '/passkey/'],
    });
  });
});
