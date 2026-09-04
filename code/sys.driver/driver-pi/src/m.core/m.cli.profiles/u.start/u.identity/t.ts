import type { t } from '../common.ts';

export type IdentityDiagnostics = Readonly<{
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
}>;

export type IdentityError = Error & {
  readonly identity?: Readonly<{
    kind: 'refused';
    manifestUrl: t.StringUrl;
    integrity: t.StringHash;
  }>;
};

export type ApplicationIdentityExpectation = Readonly<{
  expectedPkg: Readonly<t.Pkg>;
  diagnostics?: IdentityDiagnostics;
}>;

export type AdmittedApplication = Readonly<{
  origin: t.StringUrl;
  digest: t.StringHash;
}>;
