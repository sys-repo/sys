import { describe, EsmAssert, it, Path } from '../-test.ts';

describe('@tdb/data/slug export graph boundary', () => {
  it('keeps common exports @sys/fs free', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../common/mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });

  it('keeps the splash runtime graph free of devharness and broad ui barrels', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, './entry.splash.tsx'),
      forbiddenImports: ['@sys/ui-react-devharness'],
      forbiddenPathIncludes: [
        '/src/-test/common.ts',
        '/src/ui/common/u.icons.ts',
        '/src/ui/ui.Mounts/',
      ],
    });
  });
});
