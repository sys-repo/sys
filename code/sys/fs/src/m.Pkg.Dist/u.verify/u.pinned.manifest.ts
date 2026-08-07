import { Pkg } from '@sys/std/pkg';
import { normalizeTargets } from '../../m.Fs.capability/m.Rooted/u/u.target.ts';
import { CompositeHash, Ignore, Is, Obj, Path, Str, type t } from '../common.ts';
import { failure } from './u.pinned.io.ts';
import { addBytes, isSafeNonNegative } from './u.pinned.limit.ts';

const compare = Str.Compare.codeUnit();

export type StrictPart = {
  readonly path: t.StringRelativePath;
  readonly hash: t.StringHash;
  readonly size: t.NumberBytes;
};

export type StrictManifest = {
  readonly dist: t.DeepReadonly<t.DistPkg>;
  readonly parts: readonly StrictPart[];
};

export async function admitManifest(
  input: unknown,
  limits: t.Pkg.Dist.Pinned.Verify.Limits,
): Promise<StrictManifest> {
  if (!Is.plainObject(input)) throw failure('malformed');

  const value = input as Record<string, unknown>;
  if (!Is.plainObject(value.build) || !Is.plainObject(value.hash)) {
    throw failure('malformed');
  }
  const baseBuild = value.build as Record<string, unknown>;
  if (!Is.plainObject(baseBuild.hash)) throw failure('malformed');

  const baseHash = value.hash as Record<string, unknown>;
  const rawParts = baseHash.parts;
  if (!Is.plainObject(rawParts)) throw failure('malformed');

  // Enforce the declared-entry work bound before whole-collection arrays or part-value parsing.
  let partCount = 0;
  for (const path in rawParts) {
    if (!Obj.hasOwn(rawParts, path)) continue;
    if (partCount >= limits.entries) throw failure('limit-exceeded');
    partCount++;
  }
  if (partCount === 0) throw failure('malformed');
  if (!Pkg.Is.dist(value)) throw failure('malformed');

  const dist = value as t.DistPkg;
  const { build, hash } = dist;
  const entries = Object.entries(rawParts);
  if (!Is.urlString(dist.type)) throw failure('malformed');
  validatePkg(dist.pkg);

  if (!isSafeNonNegative(build.time)) throw failure('malformed');
  if (!Is.plainObject(build.size)) throw failure('malformed');
  if (!isSafeNonNegative(build.size.total) || !isSafeNonNegative(build.size.pkg)) {
    throw failure('malformed');
  }
  if (build.size.pkg > build.size.total) throw failure('malformed');
  if (!nonEmpty(build.builder) || !nonEmpty(build.runtime)) throw failure('malformed');

  if (!Is.plainObject(build.hash) || !Is.urlString(build.hash.policy)) {
    throw failure('malformed');
  }
  const ignore = build.hash.ignore;
  if (!Is.plainObject(ignore) || ignore.format !== 'gitignore') throw failure('malformed');
  if (!Is.array(ignore.rules) || !ignore.rules.every((rule) => Is.str(rule))) {
    throw failure('malformed');
  }
  const normalizedRules = Ignore.normalize(ignore.rules);
  if (!Obj.eql(normalizedRules, ignore.rules)) throw failure('malformed');
  if (!normalizedRules.every(hasBoundedWildcardStructure)) throw failure('malformed');
  if (!hashOnly(ignore['rules:digest'])) throw failure('malformed');
  let rulesDigest: t.StringHash;
  try {
    rulesDigest = await Ignore.digest(normalizedRules);
  } catch {
    throw failure('malformed');
  }
  if (rulesDigest !== ignore['rules:digest']) throw failure('malformed');

  if (!hashOnly(hash.digest)) throw failure('malformed');

  const sign = build.sign;
  if (sign !== undefined) validateSign(sign);

  const targetInputs: t.FsRooted.TargetInput<'file'>[] = entries.map(([path]) => ({
    kind: 'file',
    path,
  }));
  if (sign) targetInputs.push({ kind: 'file', path: sign.path });

  let normalized: readonly { readonly path: t.StringRelativePath }[];
  try {
    normalized = normalizeTargets(targetInputs);
  } catch {
    throw failure('unsafe-path');
  }
  for (let index = 0; index < targetInputs.length; index++) {
    if (targetInputs[index].path !== normalized[index].path) throw failure('unsafe-path');
  }

  const matcher = createMatcher(normalizedRules);
  const parts: StrictPart[] = [];
  let totalBytes = 0;
  let packageBytes = 0;

  for (let index = 0; index < entries.length; index++) {
    const rawPart = entries[index][1];
    const path = normalized[index].path;
    const name = Path.basename(path).toLowerCase();
    if (name === 'dist.json' || name === 'dist.json.sig') throw failure('unsafe-path');

    const parsed = Pkg.Dist.Part.parse(rawPart);
    if (!parsed || parsed.size === undefined) throw failure('malformed');
    if (parsed.size > limits.fileBytes) throw failure('limit-exceeded');

    totalBytes = addBytes(totalBytes, parsed.size, limits.totalBytes);
    if (Pkg.Dist.Is.codePath(path)) {
      packageBytes = addBytes(packageBytes, parsed.size, limits.totalBytes);
    }

    let ignored: boolean;
    try {
      ignored = matcher.isIgnored(path);
    } catch {
      throw failure('malformed');
    }
    if (ignored) throw failure('malformed');

    parts.push(Object.freeze({ path, hash: parsed.hash, size: parsed.size }));
  }

  if (sign) {
    const signPath = normalized[normalized.length - 1].path;
    if (Path.basename(signPath).toLowerCase() === 'dist.json') throw failure('unsafe-path');
  }

  let digest: t.StringHash;
  try {
    digest = CompositeHash.digest(hash.parts);
  } catch {
    throw failure('malformed');
  }
  if (digest !== hash.digest) throw failure('malformed');
  if (build.size.total !== totalBytes || build.size.pkg !== packageBytes) {
    throw failure('malformed');
  }

  parts.sort((a, b) => compare(a.path, b.path));
  return Object.freeze({
    dist: freezeJsonTree(dist),
    parts: Object.freeze(parts),
  });
}

function validatePkg(pkg: t.DistPkg['pkg']): void {
  if (pkg === undefined) return;
  if (!Is.plainObject(pkg) || !nonEmpty(pkg.name) || !nonEmpty(pkg.version)) {
    throw failure('malformed');
  }
}

function validateSign(sign: t.DistPkg['build']['sign']): void {
  if (!Is.plainObject(sign)) throw failure('malformed');
  if (!nonEmpty(sign.path) || sign.scheme !== 'Ed25519') throw failure('malformed');
  if (sign.key !== undefined && !nonEmpty(sign.key)) throw failure('malformed');
}

function createMatcher(rules: readonly string[]): ReturnType<typeof Ignore.create> {
  try {
    return Ignore.create(rules);
  } catch {
    throw failure('malformed');
  }
}

/** Keep synchronous matching bounded by preventing wildcards from competing for one path region. */
function hasBoundedWildcardStructure(rule: string): boolean {
  const start = rule.startsWith('!') ? 1 : 0;
  let crossDirectory = 0;
  let starsInSegment = 0;
  let inRange = false;

  for (let index = start; index < rule.length; index++) {
    const char = rule[index];
    if (char === '\\') {
      if (index + 1 >= rule.length) return false;
      index++;
      continue;
    }
    if (char === '[' && !inRange) {
      inRange = true;
      continue;
    }
    if (char === ']' && inRange) {
      inRange = false;
      continue;
    }
    if (inRange) continue;
    if (char === '/') {
      starsInSegment = 0;
      continue;
    }
    if (char !== '*') continue;

    if (rule[index + 1] === '*') {
      const atSegmentStart = index === start || rule[index - 1] === '/';
      const after = rule[index + 2];
      const atSegmentEnd = after === undefined || after === '/';
      if (!atSegmentStart || !atSegmentEnd || crossDirectory > 0) return false;
      crossDirectory++;
      index++;
      continue;
    }

    starsInSegment++;
    if (starsInSegment > 1) return false;
  }
  return !inRange;
}

function hashOnly(input: unknown): input is t.StringHash {
  const parsed = Pkg.Dist.Part.parse(input);
  return parsed !== undefined && parsed.hash === input && parsed.size === undefined;
}

function nonEmpty(input: unknown): input is string {
  return Is.str(input) && input.length > 0;
}

/** Freeze the plain object/array graph produced by authenticated `Json.parse`. */
function freezeJsonTree<T>(input: T): t.DeepReadonly<T> {
  if (!Is.object(input)) return input as t.DeepReadonly<T>;

  const pending: object[] = [input];
  const seen = new Set<object>();
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);

    const values = Is.array(current)
      ? current
      : Is.plainObject(current)
      ? Object.values(current)
      : undefined;
    if (!values) throw failure('malformed');
    for (const value of values) {
      if (Is.object(value)) pending.push(value);
    }
    Object.freeze(current);
  }
  return input as t.DeepReadonly<T>;
}
