import { describe, EsmAssert, expect, expectTypeOf, it, Obj, Path } from '../../-test.ts';
import type { t } from '../common.ts';

const root = Path.resolve(import.meta.dirname!, '..');

/** Local graph guards; external packages' transitive dependencies are not traversed. */
describe('passkey core/UI boundary', () => {
  const entries = [
    'common.ts',
    'm.WebAuthn/mod.ts',
    'm.Accounts/mod.ts',
    'm.AccountService/mod.ts',
    'm.AccountRuntime/mod.ts',
  ];
  for (const entry of entries) {
    it(`${entry} → no UI or harness runtime dependencies`, async () => {
      await EsmAssert.runtimeGraphBoundary({
        entry: Path.join(root, entry),
        forbiddenImports: [
          '@sys/ui-components',
          '@sys/ui-css',
          '@sys/ui-dom',
          '@sys/ui-react',
          '@sys/ui-dev',
          'react',
        ],
        forbiddenPathIncludes: [
          '/passkey/ui/',
          '/passkey/-spec/',
          '/src/ui.react/',
          ...(entry === 'm.AccountRuntime/mod.ts' ? ['/passkey/m.AccountService/'] : []),
        ],
      });
    });
  }

  it('core type pool → no presentation or React contracts', () => {
    // @ts-expect-error Presentation contracts belong to the UI type pool.
    expectTypeOf<t.Passkey.Props | undefined>(undefined);
    // @ts-expect-error React contracts belong to the UI type pool.
    expectTypeOf<t.FC | undefined>(undefined);
    // @ts-expect-error Component contracts belong to the UI type pool.
    expectTypeOf<t.KeyValue.Item | undefined>(undefined);
    // @ts-expect-error CSS contracts belong to the UI type pool.
    expectTypeOf<t.Style.Input | undefined>(undefined);
  });

  it('core type entry → no runtime exports', async () => {
    expect(Obj.keys(await import('../types.ts'))).to.eql([]);
  });
});
