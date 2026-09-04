import { Is, type t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { AUTHORITY_LIMITS } from '../u.limits.ts';
import type { IdentityDiagnostics, IdentityError } from './t.ts';

const IDENTITY_ERRORS = new WeakSet<object>();

/** Copy one expected package identity into Driver-owned immutable policy. */
export function snapshotExpectedPkg(
  input: unknown,
  diagnostics?: IdentityDiagnostics,
): Readonly<t.Pkg> {
  try {
    if (!Is.object(input)) refuseIdentity(diagnostics);
    const pkg = input as Partial<t.Pkg>;
    const name = pkg.name;
    const version = pkg.version;
    if (
      !isBoundedIdentity(name, AUTHORITY_LIMITS.packageName) ||
      !isBoundedIdentity(version, AUTHORITY_LIMITS.packageVersion)
    ) refuseIdentity(diagnostics);
    return Object.freeze({ name, version });
  } catch (cause) {
    if (isIdentityError(cause)) throw cause;
    refuseIdentity(diagnostics);
  }
}

/** Apply Driver Pi's package identity policy to one Server-owned generation. */
export function admitGenerationPkg(input: {
  expected: Readonly<t.Pkg>;
  generation: t.Dist.Existing | t.Dist.Promoted;
  diagnostics: IdentityDiagnostics;
}): t.StringAbsoluteDir {
  const observed = input.generation.verification.dist.pkg;
  if (
    !observed || observed.name !== input.expected.name ||
    observed.version !== input.expected.version
  ) refuseIdentity(input.diagnostics);
  return input.generation.dir;
}

/** Determine whether a failure came from Driver Pi's package-identity policy. */
export function isIdentityError(input: unknown): input is IdentityError {
  return Is.object(input) && IDENTITY_ERRORS.has(input);
}

/** Emit the stable package-identity refusal with bounded release diagnostics. */
export function refuseIdentity(diagnostics?: IdentityDiagnostics): never {
  const error = createOwnedError('start:gui refused GUI Dist package identity.') as IdentityError;
  if (diagnostics) {
    Object.defineProperty(error, 'identity', {
      configurable: false,
      enumerable: true,
      value: Object.freeze({
        kind: 'refused' as const,
        manifestUrl: diagnostics.manifestUrl,
        integrity: diagnostics.integrity,
      }),
    });
  }
  IDENTITY_ERRORS.add(error);
  throw error;
}

/** Admit one bounded non-empty string without control characters. */
export function isBoundedIdentity(input: unknown, max: number): input is string {
  if (!Is.string(input) || input.length === 0 || input.length > max) return false;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  return true;
}
