import { Is, Json, Obj, Str, type t } from '../common.ts';
import { Part } from './m.Dist.Part.ts';

const scheme: t.DistScheme = 'sys.dist/v2';
const limits: Readonly<t.Pkg.Dist.Content.Limits> = Object.freeze({
  entries: 65_536,
  pathLength: 4_096,
  pathTotal: 4_194_304,
  encodedBytes: 33_554_432,
});
const compare = Str.Compare.codeUnit();

/**
 * Pure Dist preimage encoding. No digest, document metadata, or filesystem policy enters this tuple.
 */
export const Content: t.Pkg.Dist.Content.Lib = Object.freeze({ scheme, limits, encode });

/** Internal shared implementation: validate unknown observations without a premature parts cast. */
export function encode(parts: unknown): string {
  if (!Is.plainObject(parts)) throw malformed();
  const tuples: [string, string, number][] = [];
  let pathTotal = 0;
  let encodedBound = 32; // Domain and outer tuple punctuation.

  // Bound collection and string work before sorting or serializing. Parsed JSON owns its data;
  // selected own enumerable properties must be data descriptors, not accessors.
  // This pure encoder does not provide a hook-free boundary for programmatic proxies.
  for (const path in parts) {
    if (!Obj.hasOwn(parts, path)) continue;
    if (tuples.length >= limits.entries || path.length > limits.pathLength) throw exceeded();
    pathTotal += path.length;
    if (pathTotal > limits.pathTotal) throw exceeded();
    encodedBound += 6 * path.length + 128; // Worst-case JSON escaping plus hash/length/punctuation.
    if (encodedBound > limits.encodedBytes) throw exceeded();
    if (!path || !path.isWellFormed()) throw malformed();

    const property = Object.getOwnPropertyDescriptor(parts, path);
    if (!property || !Obj.hasOwn(property, 'value')) throw malformed();
    const value = property.value;
    // SHA-256 plus ':size=' plus at most sixteen safe-integer decimal digits.
    if (!Is.str(value) || value.length > 93) throw malformed();
    const part = Part.parse(value);
    if (!part || part.size === undefined) throw malformed();
    tuples.push([path, part.hash, part.size]);
  }
  if (tuples.length === 0) throw malformed();
  tuples.sort((a, b) => compare(a[0], b[0]));
  return Json.stringify([scheme, tuples], 0);
}

function malformed(): TypeError {
  return new TypeError('Invalid Dist content.');
}

function exceeded(): RangeError {
  return new RangeError('Dist content limit exceeded.');
}
