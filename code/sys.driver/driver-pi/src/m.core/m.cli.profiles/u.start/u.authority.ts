import { Fs, Is, StartGuiIntrinsic, type t } from './common.ts';
import {
  type EvidenceSnapshot,
  type IdentityDiagnostics,
  refuseIdentity,
  snapshotEvidence,
  snapshotExpectedPkg,
} from './u.identity.ts';
import { createOwnedError, ownedError } from './u.error.ts';
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
const CONFIGURATION_ERRORS = StartGuiIntrinsic.createWeakSet<object>();
const apply = Reflect.apply;
const defineProperty = Object.defineProperty;
const freeze = Object.freeze;
const isAbsolutePath = Fs.Path.Is.absolute;

/**
 * Validate, canonicalize, and copy caller authority synchronously.
 * Publication remains deferred until bootstrap exists, but no raw caller text crosses that boundary.
 */
export function snapshotAuthorityEvidence(input: unknown): AuthoritySnapshot {
  const evidence = snapshotEvidence(input);
  try {
    if (!evidence.kind || !evidence.authorityReadable) refuseIdentity();
    return evidence.kind === 'release' ? settleRelease(evidence) : settleDevelopment(evidence);
  } catch (cause) {
    return freeze({
      kind: 'invalid',
      error: ownedError(cause, 'Invalid start:gui authority.'),
    });
  }
}

/** Determine whether a failure is one of the package-owned configuration errors. */
export function isConfigurationError(input: unknown): input is ConfigurationError {
  return Is.object(input) && StartGuiIntrinsic.weakSetHas(CONFIGURATION_ERRORS, input);
}

function settleRelease(evidence: EvidenceSnapshot): AuthoritySnapshot {
  let source: ManifestSource;
  try {
    source = resolveManifestSource(evidence.manifestUrl);
  } catch {
    throw configurationError('manifest-url');
  }

  const integrity = settleIntegrity(evidence.integrity);
  const diagnostics = freeze({ manifestUrl: source.href, integrity });
  const expectedPkg = snapshotExpectedPkg(evidence, diagnostics);
  return freeze({
    kind: 'valid',
    authority: freeze({
      kind: 'release',
      source: freeze({ ...source }),
      integrity,
      expectedPkg,
      diagnostics,
    }),
  });
}

function settleDevelopment(evidence: EvidenceSnapshot): AuthoritySnapshot {
  if (
    !Is.string(evidence.dir) || StartGuiIntrinsic.stringIncludes(evidence.dir, '\0') ||
    !apply(isAbsolutePath, undefined, [evidence.dir])
  ) {
    throw configurationError('development-directory');
  }
  const integrity = settleIntegrity(evidence.integrity);
  const expectedPkg = snapshotExpectedPkg(evidence);
  return freeze({
    kind: 'valid',
    authority: freeze({
      kind: 'development',
      dir: evidence.dir,
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
  defineProperty(error, 'configuration', {
    configurable: false,
    enumerable: true,
    value: reason,
  });
  StartGuiIntrinsic.weakSetAdd(CONFIGURATION_ERRORS, error);
  return error;
}
