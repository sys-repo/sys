import { lstat, realPath } from '@sys/fs/observe';
import type { t } from '../common.ts';
import { Arr, Json, Obj, Path } from '../common.ts';
import { fileIdentity, fold } from './u.guard.ts';

const PROTECTED_NAMES = ['.git', '.pi', '.sys.rooted'] as const;

const ZIP_LIMITS = {
  maxSourceBytes: 67_108_864,
  maxEntries: 2_048,
  maxTreeEntries: 8_192,
  maxPathBytes: 512,
  maxPathDepth: 32,
  maxEntryBytes: 134_217_728,
  maxExpandedBytes: 536_870_912,
  maxErrorChars: 16_000,
} as const;

/**
 * Resolve immutable launch-time policy for bounded ZIP tools.
 */
export async function resolvePolicy(
  input: t.PiZipExtension.ResolvePolicyInput,
): Promise<t.PiZipExtension.Policy> {
  if (input.extract !== undefined && (input.extract !== 'cooperative' || input.enabled !== true)) {
    throw new Error('ZIP extraction requires enabled: true and extract: cooperative.');
  }
  const writeRoots = input.extract
    ? await Promise.all(
      Arr.uniq((input.writeRoots ?? []).map((path) => Path.resolve(path)))
        .map((path) => rootEvidence(path, true)),
    )
    : [];
  const readRoots = await Promise.all(
    Arr.uniq(input.readRoots.map((path) => Path.resolve(path))).map((path) =>
      rootEvidence(path, true)
    ),
  );
  const protectedRoots = await Promise.all(
    Arr.uniq(input.protectedRoots.map((path) => Path.resolve(path))).map((path) =>
      rootEvidence(path, false)
    ),
  );

  return Obj.deepFreeze({
    version: 1,
    enabled: input.enabled !== false,
    ...(input.extract ? { extract: input.extract } : {}),
    readRoots,
    writeRoots,
    protectedRoots,
    protectedNames: PROTECTED_NAMES,
    operationTimeoutMs: 120_000,
    maxArgumentChars: 4_096,
    maxDisplayChars: 60_000,
    maxErrorChars: 16_000,
    snapshotMaxBytes: ZIP_LIMITS.maxSourceBytes,
    zipLimits: ZIP_LIMITS,
  });
}

/**
 * Resolve tool names registered by an enabled ZIP policy.
 */
export function toolNames(policy: t.PiZipExtension.Policy): readonly t.PiZipExtension.ToolName[] {
  if (!policy.enabled) return [];
  return policy.extract === 'cooperative'
    ? ['zip_inspect', 'zip_test', 'zip_extract']
    : ['zip_inspect', 'zip_test'];
}

async function rootEvidence(
  path: string,
  readable: boolean,
): Promise<t.PiZipExtension.RootEvidence> {
  const base = {
    path,
    foldedNfc: fold(path, 'NFC'),
    foldedNfd: fold(path, 'NFD'),
  };

  let info: Deno.FileInfo | undefined;
  try {
    info = await lstat(path);
  } catch {
    throw new Error(`ZIP policy root could not be inspected: ${Json.stringify(path)}`);
  }
  // Absence preserves lexical scope without inventing canonical evidence or creating a root.
  if (!info) return base;

  if (readable && (info.isSymlink || !info.isDirectory)) {
    throw new Error(`ZIP readable root must be a real directory: ${Json.stringify(path)}`);
  }

  let real: string;
  try {
    real = await realPath(path);
  } catch {
    throw new Error(`ZIP policy root could not be canonicalized: ${Json.stringify(path)}`);
  }

  const value = fileIdentity(info);
  return {
    ...base,
    real,
    realFoldedNfc: fold(real, 'NFC'),
    realFoldedNfd: fold(real, 'NFD'),
    ...(value ? { identity: value } : {}),
  };
}
