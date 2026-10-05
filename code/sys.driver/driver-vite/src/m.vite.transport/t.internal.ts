import type { t } from './common.ts';
export type * from '../common.t.ts';

export type DenoLoader = 'JSX' | 'JavaScript' | 'Json' | 'TSX' | 'TypeScript';

export type DenoDependency = {
  readonly specifier: string;
  readonly resolvedSpecifier: string;
  readonly sourceSpecifier?: string;
  readonly localPath?: string;
  readonly loader?: DenoLoader | null;
};

export type DenoResolvedEsm = {
  readonly id: string;
  readonly specifier?: string;
  readonly kind: 'esm';
  readonly loader: DenoLoader | null;
  readonly dependencies: readonly DenoDependency[];
};

export type DenoResolvedNpm = {
  readonly id: string;
  readonly kind: 'npm';
  readonly loader: null;
  readonly dependencies: readonly [];
};

export type DenoResolved = DenoResolvedEsm | DenoResolvedNpm;

export type DenoTransformedModule = {
  readonly code: string;
  readonly map: string | null;
};

export type DenoCache = Map<string, DenoResolved>;

export type ResolveDeps = {
  readonly invoke: t.Process.Lib['invoke'];
  readonly resolveLoader?: (
    id: string,
    referrer: string | undefined,
    cwd: string,
  ) => Promise<string | null | undefined>;
  readonly resolveNpmPath?: (id: string, cwd: string) => Promise<string | null>;
};

export type PrefixDeps = {
  readonly resolveNpmPath: (id: string, cwd: string) => Promise<string | null>;
  readonly resolveViteSpecifier: (
    id: string,
    cache: DenoCache,
    posixRoot: string,
    importer?: string,
    deps?: ResolveDeps,
  ) => Promise<string | null | undefined>;
};
