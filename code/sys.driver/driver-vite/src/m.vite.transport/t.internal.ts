import type { t } from './common.ts';
export type * from '../common.t.ts';

export type DenoLoader = 'JSX' | 'JavaScript' | 'Json' | 'TSX' | 'TypeScript';

export type ResolveInfoDependency = {
  readonly specifier: string;
  readonly code: {
    readonly specifier: string;
  };
};

export type DenoDependency = {
  readonly specifier: string;
  readonly resolvedSpecifier: string;
};

export type DenoResolvedEsm = {
  readonly id: string;
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

export type DenoCache = Map<string, DenoResolved>;

export type ResolveDeps = {
  readonly invoke: t.ProcLib['invoke'];
  readonly resolveImport: (id: string) => string;
};

export type PrefixDeps = {
  readonly resolveDeno: (id: string, cwd: string) => Promise<DenoResolved | null>;
  readonly resolveViteSpecifier: (
    id: string,
    cache: DenoCache,
    posixRoot: string,
    importer?: string,
    deps?: ResolveDeps,
  ) => Promise<string | null | undefined>;
};

export type ResolveInfoError = {
  readonly error: string;
};

export type ResolveInfoModuleEsm = {
  readonly kind: 'esm';
  readonly local: string;
  readonly mediaType?: DenoLoader;
  readonly dependencies?: readonly ResolveInfoDependency[];
  readonly specifier: string;
};

export type ResolveInfoModuleNpm = {
  readonly kind: 'npm';
  readonly npmPackage: string;
  readonly specifier: string;
};

export type ResolveInfoModuleExternal = {
  readonly kind: 'external';
  readonly specifier?: string;
};

export type ResolveInfoModule =
  | ResolveInfoModuleEsm
  | ResolveInfoModuleNpm
  | ResolveInfoModuleExternal;

export type ResolveInfo = {
  readonly roots: readonly string[];
  readonly redirects?: Readonly<Record<string, string>>;
  readonly modules: readonly (ResolveInfoModule | ResolveInfoError)[];
};
