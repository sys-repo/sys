import { Fs, Is, type t } from './common.ts';
import {
  type IdentityDiagnostics,
  isBoundedIdentity,
  refuseIdentity,
  snapshotExpectedPkg,
} from './u.identity/mod.ts';
import { createOwnedError, ownedError } from './u.error.ts';
import { AUTHORITY_LIMITS } from './u.limits.ts';
import { type ManifestSource, resolveIntegrity, resolveManifestSource } from './u.source.ts';

type ReleaseAuthority = Readonly<{
  kind: 'release';
  source: ManifestSource;
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
  diagnostics: IdentityDiagnostics;
}>;

type DevelopmentAuthority = Readonly<{
  kind: 'development';
  dir: t.StringAbsoluteDir;
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
}>;

type StartGuiAuthority = ReleaseAuthority | DevelopmentAuthority;
export type AuthoritySnapshot =
  | Readonly<{ kind: 'valid'; authority: StartGuiAuthority }>
  | Readonly<{ kind: 'invalid'; error: Error }>;

type ConfigurationReason = 'manifest-url' | 'integrity' | 'development-directory';
type ConfigurationError = Error & { readonly configuration: ConfigurationReason };
const CONFIGURATION_ERRORS = new WeakSet<object>();

/** Validate and synchronously copy one loose GUI source into immutable Driver-owned policy. */
export function snapshotAuthorityEvidence(input: unknown): AuthoritySnapshot {
  try {
    if (!Is.object(input)) refuseIdentity();
    const source = input as Record<string, unknown>;
    if (source.kind === 'release') return settleRelease(source);
    if (source.kind === 'development') return settleDevelopment(source);
    refuseIdentity();
  } catch (cause) {
    return Object.freeze({
      kind: 'invalid',
      error: ownedError(cause, 'Invalid start:gui authority.'),
    });
  }
}

/** Determine whether a failure is one of Driver Pi's configuration errors. */
export function isConfigurationError(input: unknown): input is ConfigurationError {
  return Is.object(input) && CONFIGURATION_ERRORS.has(input);
}

function settleRelease(input: Record<string, unknown>): AuthoritySnapshot {
  let source: ManifestSource;
  try {
    source = resolveManifestSource(input.manifestUrl);
  } catch {
    throw configurationError('manifest-url');
  }
  const integrity = settleIntegrity(input.integrity);
  const diagnostics = Object.freeze({ manifestUrl: source.href, integrity });
  const expectedPkg = snapshotExpectedPkg(input.expectedPkg, diagnostics);
  return Object.freeze({
    kind: 'valid',
    authority: Object.freeze({
      kind: 'release',
      source,
      integrity,
      expectedPkg,
      diagnostics,
    }),
  });
}

function settleDevelopment(input: Record<string, unknown>): AuthoritySnapshot {
  const dir = input.dir;
  if (
    !isBoundedIdentity(dir, AUTHORITY_LIMITS.developmentDir) || !Fs.Path.Is.absolute(dir)
  ) {
    throw configurationError('development-directory');
  }
  const integrity = settleIntegrity(input.integrity);
  const expectedPkg = snapshotExpectedPkg(input.expectedPkg);
  return Object.freeze({
    kind: 'valid',
    authority: Object.freeze({
      kind: 'development',
      dir: dir as t.StringAbsoluteDir,
      integrity,
      expectedPkg,
    }),
  });
}

function settleIntegrity(input: unknown): t.StringHash {
  try {
    return resolveIntegrity(input);
  } catch {
    throw configurationError('integrity');
  }
}

function configurationError(reason: ConfigurationReason): ConfigurationError {
  const message = reason === 'manifest-url'
    ? 'Invalid start:gui manifest URL.'
    : reason === 'integrity'
    ? 'Invalid start:gui manifest integrity.'
    : 'Invalid start:gui development directory.';
  const error = createOwnedError(message) as ConfigurationError;
  Object.defineProperty(error, 'configuration', {
    configurable: false,
    enumerable: true,
    value: reason,
  });
  CONFIGURATION_ERRORS.add(error);
  return error;
}
