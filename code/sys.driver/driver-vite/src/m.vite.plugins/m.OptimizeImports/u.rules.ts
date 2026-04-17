import type { t } from './common.ts';

export const DEFAULT_PACKAGE_RULES: readonly t.OptimizeImportsPlugin.PackageRule[] = [
  {
    packageId: '@sys/ui-react-devharness',
    imports: [
      { importName: 'useKeyboard', subpath: './hooks', kind: 'value' },
      { importName: 'useRubberband', subpath: './hooks', kind: 'value' },
    ],
  },
] as const;
