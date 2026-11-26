import { describe, EsmAssert, expect, expectTypeOf, it, Obj, Path } from '../../-test.ts';
import type { t } from '../common.ts';

const root = Path.resolve(import.meta.dirname!, '..');

/** Local graph guards; external packages' transitive dependencies are not traversed. */
describe('passkey core/UI boundary', () => {
  const entries = [
    'common.ts',
    'm.WebAuthn/mod.ts',
    'm.Accounts/mod.ts',
    'm.Account.Service/mod.ts',
    'm.Account.Runtime/mod.ts',
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
          '/passkey/ui.controller/',
          '/src/ui.react/',
          ...(entry === 'm.Account.Runtime/mod.ts' ? ['/passkey/m.Account.Service/'] : []),
        ],
      });
    });
  }

  for (const entry of ['ui/mod.ts', 'ui/-spec/-SPEC.tsx']) {
    it(`${entry} → no controller or account implementation`, async () => {
      await EsmAssert.runtimeGraphBoundary({
        entry: Path.join(root, entry),
        forbiddenPathIncludes: [
          '/passkey/ui.controller/',
          '/passkey/m.WebAuthn/',
          '/passkey/m.Account.Runtime/',
          '/passkey/m.Account.Service/',
        ],
      });
    });
  }

  it('controller leaf → no harness, specimen, or service implementation', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.join(root, 'ui.controller/mod.ts'),
      forbiddenImports: ['@sys/ui-dev'],
      forbiddenPathIncludes: ['/-spec/', '/-spec.integration/', '/-test/', '/m.Account.Service/'],
    });
  });

  it('core type pool → no presentation or React contracts', () => {
    // @ts-expect-error Presentation contracts belong to the UI type pool.
    expectTypeOf<t.Passkey.Props | undefined>(undefined);
    // @ts-expect-error Controller contracts belong to the UI type pool.
    expectTypeOf<t.Controller.Instance | undefined>(undefined);
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
