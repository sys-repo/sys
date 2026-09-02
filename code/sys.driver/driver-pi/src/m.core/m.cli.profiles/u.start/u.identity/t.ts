import type { t } from '../common.ts';

export type IdentityDiagnostics = Readonly<{
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
}>;

export type EvidenceSnapshot = Readonly<{
  kind: 'release' | 'development' | undefined;
  authorityReadable: boolean;
  exact: boolean;
  manifestUrl: unknown;
  dir: unknown;
  integrity: unknown;
  expectedPkg: Readonly<t.Pkg> | undefined;
}>;

export type AdmittedGenerationSettlement = Readonly<{
  kind: 'generation';
  dir: t.StringAbsoluteDir;
  cleanup: t.Dist.Cleanup;
  observedPkg: Readonly<t.Pkg> | undefined;
}>;

export type AdmittedGeneration = Readonly<{
  kind: 'admitted';
  dir: t.StringAbsoluteDir;
  cleanup: t.Dist.Cleanup;
}>;

export type AdmittedMaterialization = AdmittedGenerationSettlement | t.Dist.Failed;

export type IdentityError = Error & {
  readonly identity?: Readonly<{
    kind: 'refused';
    manifestUrl: t.StringUrl;
    integrity: t.StringHash;
  }>;
};

export type ApplicationOwner = Readonly<{
  close(reason?: unknown): Promise<void>;
}>;

export type AdmittedApplicationOwner =
  & ApplicationOwner
  & Readonly<{ origin: t.StringUrl; digest: t.StringHash }>;

export type ApplicationIdentityExpectation = Readonly<{
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
  diagnostics?: IdentityDiagnostics;
}>;

export type ApplicationOwnerSnapshot =
  | Readonly<{
    kind: 'admitted';
    owner: AdmittedApplicationOwner;
    finished: Promise<void>;
  }>
  | Readonly<{
    kind: 'refused';
    owner: ApplicationOwner;
    finished: Promise<void>;
  }>
  | Readonly<{
    kind: 'invalid';
    owner?: ApplicationOwner;
    finished?: Promise<void>;
  }>;
