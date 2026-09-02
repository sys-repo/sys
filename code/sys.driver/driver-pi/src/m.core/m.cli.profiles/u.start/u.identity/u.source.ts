import { Is, StartGuiIntrinsic, type t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { AUTHORITY_LIMITS } from '../u.limits.ts';
import { resolveIntegrity } from '../u.source.ts';
import type { EvidenceSnapshot, IdentityDiagnostics, IdentityError } from './t.ts';
import {
  hasExactDataShape,
  isFrozenObject,
  type ObjectSnapshot,
  ownData,
  snapshotObject,
} from './u.snapshot.ts';

const defineProperty = Object.defineProperty;
const freeze = Object.freeze;

// Permit bounded surplus evidence to retain safe diagnostics without unbounded descriptor inspection.
const SOURCE_SNAPSHOT_KEY_LIMIT = 8;
const KEYS = {
  RELEASE_SOURCE: ['kind', 'manifestUrl', 'integrity', 'expectedPkg'],
  DEVELOPMENT_SOURCE: ['kind', 'dir', 'integrity', 'expectedPkg'],
  PKG: ['name', 'version'],
  VERIFICATION: ['integrity', 'dist', 'manifestBytes', 'assets'],
  DIST: ['type', 'pkg', 'build', 'hash'],
  DIST_HASH: ['digest', 'parts'],
} as const;

const IDENTITY_ERRORS = StartGuiIntrinsic.createWeakSet<object>();
const EMPTY_EVIDENCE: EvidenceSnapshot = freeze({
  kind: undefined,
  authorityReadable: false,
  exact: false,
  manifestUrl: undefined,
  dir: undefined,
  integrity: undefined,
  expectedPkg: undefined,
});

/**
 * Snapshot one complete source descriptor without invoking caller-owned accessors or Proxy traps.
 */
export function snapshotEvidence(input: unknown): EvidenceSnapshot {
  const source = snapshotObject(input, SOURCE_SNAPSHOT_KEY_LIMIT);
  if (!source) return EMPTY_EVIDENCE;

  const rawKind = ownData(source, 'kind');
  const kind = rawKind.ok && (rawKind.value === 'release' || rawKind.value === 'development')
    ? rawKind.value
    : undefined;
  const manifestUrl = ownData(source, 'manifestUrl');
  const dir = ownData(source, 'dir');
  const integrity = ownData(source, 'integrity');
  const rawExpectedPkg = ownData(source, 'expectedPkg');
  const expectedPkg = rawExpectedPkg.ok
    ? snapshotExpectedPkgValue(rawExpectedPkg.value)
    : undefined;
  const locationReadable = kind === 'release' ? manifestUrl.ok : kind === 'development' && dir.ok;
  const authorityReadable = locationReadable && integrity.ok;
  const retainedManifestUrl = manifestUrl.ok &&
      isBoundedIdentity(manifestUrl.value, AUTHORITY_LIMITS.manifestUrl)
    ? manifestUrl.value
    : undefined;
  const retainedDir = dir.ok && isBoundedIdentity(dir.value, AUTHORITY_LIMITS.developmentDir)
    ? dir.value
    : undefined;
  const retainedIntegrity = integrity.ok &&
      isBoundedIdentity(integrity.value, AUTHORITY_LIMITS.integrity)
    ? integrity.value
    : undefined;
  const sourceKeys = kind === 'release'
    ? KEYS.RELEASE_SOURCE
    : kind === 'development'
    ? KEYS.DEVELOPMENT_SOURCE
    : [];
  const exact = authorityReadable && rawExpectedPkg.ok && sourceKeys.length > 0 &&
    hasExactDataShape(source, sourceKeys) && expectedPkg !== undefined;

  return freeze({
    kind,
    authorityReadable,
    exact,
    manifestUrl: retainedManifestUrl,
    dir: retainedDir,
    integrity: retainedIntegrity,
    expectedPkg,
  });
}

/**
 * Return the already-copied expected identity or emit the stable refusal.
 */
export function snapshotExpectedPkg(
  input: EvidenceSnapshot,
  diagnostics?: IdentityDiagnostics,
): Readonly<t.Pkg> {
  if (!input.exact || !input.expectedPkg) refuseIdentity(diagnostics);
  return input.expectedPkg;
}

/**
 * Determine whether a failure came from the package-owned identity boundary.
 */
export function isIdentityError(input: unknown): input is IdentityError {
  return Is.object(input) && StartGuiIntrinsic.weakSetHas(IDENTITY_ERRORS, input);
}

/**
 * Emit the stable identity refusal without exposing caller-controlled evidence.
 */
export function refuseIdentity(diagnostics?: IdentityDiagnostics): never {
  throw identityError(diagnostics);
}

/** Admit one canonical integrity value through the existing source parser. */
export function isCanonicalIntegrity(input: unknown): input is t.StringHash {
  try {
    return resolveIntegrity(input) === input;
  } catch {
    return false;
  }
}

/** Snapshot the frozen verified Dist identity shared by materialization and application admission. */
export function snapshotVerifiedDist(
  input: unknown,
  integrity: t.StringHash,
): Readonly<{ pkg: Readonly<t.Pkg> | undefined; digest: t.StringHash }> | undefined {
  const verification = snapshotObject(input, KEYS.VERIFICATION.length);
  if (
    !verification || !isFrozenObject(verification.target) ||
    !hasExactDataShape(verification, KEYS.VERIFICATION)
  ) return;
  const verificationIntegrity = ownData(verification, 'integrity');
  const distValue = ownData(verification, 'dist');
  if (!verificationIntegrity.ok || verificationIntegrity.value !== integrity || !distValue.ok) {
    return;
  }

  const dist = snapshotObject(distValue.value, KEYS.DIST.length);
  if (!dist || !isFrozenObject(dist.target) || !hasExactDataShape(dist, KEYS.DIST)) return;
  const pkgValue = ownData(dist, 'pkg');
  const hashValue = ownData(dist, 'hash');
  const hash = hashValue.ok ? snapshotObject(hashValue.value, KEYS.DIST_HASH.length) : undefined;
  if (!hash || !isFrozenObject(hash.target) || !hasExactDataShape(hash, KEYS.DIST_HASH)) return;
  const digest = ownData(hash, 'digest');
  if (!digest.ok || !isCanonicalIntegrity(digest.value)) return;
  return freeze({
    pkg: pkgValue.ok ? snapshotObservedPkg(pkgValue.value) : undefined,
    digest: digest.value,
  });
}

/** Admit one bounded non-empty string without C0 or delete controls. */
export function isBoundedIdentity(input: unknown, max: number): input is string {
  if (!Is.string(input) || input.length === 0 || input.length > max) return false;
  // Indexed traversal avoids ambient string-iterator authority.
  for (let index = 0; index < input.length; index += 1) {
    const code = StartGuiIntrinsic.stringCharCodeAt(input, index);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  return true;
}

function snapshotExpectedPkgValue(input: unknown): Readonly<t.Pkg> | undefined {
  const pkg = snapshotObject(input, KEYS.PKG.length);
  return pkg && snapshotPkgProperties(pkg);
}

function snapshotObservedPkg(input: unknown): Readonly<t.Pkg> | undefined {
  const pkg = snapshotObject(input, KEYS.PKG.length);
  if (!pkg || !isFrozenObject(pkg.target)) return;
  return snapshotPkgProperties(pkg);
}

function snapshotPkgProperties(input: ObjectSnapshot): Readonly<t.Pkg> | undefined {
  if (!hasExactDataShape(input, KEYS.PKG)) return;
  const name = ownData(input, 'name');
  const version = ownData(input, 'version');
  if (!name.ok || !version.ok) return;
  if (!isBoundedIdentity(name.value, AUTHORITY_LIMITS.packageName)) return;
  if (!isBoundedIdentity(version.value, AUTHORITY_LIMITS.packageVersion)) return;
  const pkg: Readonly<t.Pkg> = freeze({ name: name.value, version: version.value });
  return pkg;
}

function identityError(diagnostics?: IdentityDiagnostics): IdentityError {
  const error = createOwnedError(
    'start:gui refused GUI Dist package identity.',
  ) as IdentityError;
  if (diagnostics) {
    defineProperty(error, 'identity', {
      configurable: false,
      enumerable: true,
      value: freeze({
        kind: 'refused' as const,
        manifestUrl: diagnostics.manifestUrl,
        integrity: diagnostics.integrity,
      }),
    });
  }
  StartGuiIntrinsic.weakSetAdd(IDENTITY_ERRORS, error);
  return error;
}
