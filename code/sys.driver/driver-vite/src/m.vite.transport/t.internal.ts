export type * from '../common.t.ts';

export type DenoLoader = 'JSX' | 'JavaScript' | 'Json' | 'TSX' | 'TypeScript';

export type DenoDependency = {
  readonly specifier: string;
  readonly code: {
    readonly specifier: string;
  };
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

export type ResolveInfoError = {
  readonly error: string;
};

export type ResolveInfoModule = {
  readonly kind?: 'esm' | 'npm' | 'external';
  readonly local?: string;
  readonly mediaType?: DenoLoader;
  readonly npmPackage?: string;
  readonly dependencies?: readonly DenoDependency[];
  readonly specifier?: string;
};

export type ResolveInfo = {
  readonly roots: readonly string[];
  readonly redirects?: Readonly<Record<string, string>>;
  readonly modules: readonly (ResolveInfoModule | ResolveInfoError)[];
};
