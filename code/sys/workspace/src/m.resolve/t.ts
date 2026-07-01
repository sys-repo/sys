import type { t } from './common.ts';

/**
 * Shared Deno resolver facts for package specifiers.
 */
export declare namespace WorkspaceResolve {
  /** Package resolver surface. */
  export type Lib = {
    /** Resolve a package specifier using Deno's active resolver policy. */
    resolvePackage(args: PackageResolutionRequest): Promise<PackageResolutionFact>;
  };

  /** Input for a Deno package resolution probe. */
  export type PackageResolutionRequest = {
    /** Working directory used by Deno to discover config, lock, and policy. */
    readonly cwd: t.StringDir;
    /** Package specifier to resolve, for example `jsr:@sys/tools`. */
    readonly specifier: t.StringModuleSpecifier;
    /** Ask Deno to reload resolver/source cache before reporting facts. */
    readonly reload?: boolean;
  };

  /** Canonical package resolution reason. */
  export type PackageResolutionReason =
    | { readonly code: 'policy:minimum-dependency-age'; readonly message?: string }
    | { readonly code: 'config-or-lock'; readonly message?: string }
    | { readonly code: 'registry'; readonly message?: string }
    | { readonly code: 'unknown'; readonly message?: string };

  /** Successful package resolution fact. */
  export type PackageResolutionOk = {
    readonly ok: true;
    readonly specifier: t.StringModuleSpecifier;
    readonly registry: t.EsmRegistry;
    readonly package: t.StringPkgName;
    /** Version Deno actually resolved under active policy. */
    readonly resolved: t.StringSemver;
  };

  /** Failed or incomplete package resolution fact. */
  export type PackageResolutionFailed = {
    readonly ok: false;
    readonly specifier: t.StringModuleSpecifier;
    readonly registry?: t.EsmRegistry;
    readonly package?: t.StringPkgName;
    readonly resolved?: t.StringSemver;
    readonly reason: PackageResolutionReason;
  };

  /** Deno package resolution fact. */
  export type PackageResolutionFact = PackageResolutionOk | PackageResolutionFailed;
}
