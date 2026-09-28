import { Is, Num, type t } from '../common.ts';
import { Content, encode } from '../m/m.Dist.Content.ts';
import { pkg, sha256Hash } from './u.ts';

type DistBase = {
  type: string;
  pkg?: t.Pkg;
  build: object;
  hash: { digest: string; parts: object };
};

export function dist(input: unknown): input is t.DistPkg {
  if (!wrangle.distBase(input)) return false;
  const { build, hash } = input;
  if (!('time' in build) || !Num.Is.finite(build.time)) return false;
  if (!('builder' in build) || !Is.str(build.builder)) return false;
  if (!('runtime' in build) || !Is.str(build.runtime)) return false;
  if (!('size' in build) || !Is.plainObject(build.size)) return false;
  if (!Num.Is.safeInt(build.size.total) || build.size.total < 0) return false;
  if (!Num.Is.safeInt(build.size.pkg) || build.size.pkg < 0) return false;
  if (!('hash' in build) || !Is.object(build.hash)) return false;
  const metadata = build.hash;
  if (!('policy' in metadata) || !Is.str(metadata.policy)) return false;
  if ('ignore' in metadata && metadata.ignore !== undefined) {
    const ignore = metadata.ignore;
    if (!Is.object(ignore)) return false;
    if (!('format' in ignore) || ignore.format !== 'gitignore') return false;
    if (!('rules' in ignore) || !Is.array(ignore.rules)) return false;
    if (!ignore.rules.every((rule) => Is.str(rule))) return false;
    if (!('rules:digest' in ignore) || !sha256Hash(ignore['rules:digest'])) return false;
  }
  if ('sign' in build && build.sign !== undefined) {
    const sign = build.sign;
    if (!Is.object(sign)) return false;
    if (!('path' in sign) || !Is.str(sign.path)) return false;
    if (!('scheme' in sign) || sign.scheme !== 'Ed25519') return false;
    if ('key' in sign && sign.key !== undefined && !Is.str(sign.key)) return false;
  }
  if (!('scheme' in hash) || hash.scheme !== Content.scheme) return false;
  if (!sha256Hash(hash.digest)) return false;
  try {
    encode(hash.parts);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helpers:
 */
const wrangle = {
  distBase(input: unknown): input is DistBase {
    if (!Is.object(input)) return false;
    if (!('type' in input) || !Is.str(input.type)) return false;
    if ('pkg' in input && input.pkg !== undefined && !pkg(input.pkg)) return false;
    if (!('build' in input) || !('hash' in input)) return false;
    const { build, hash } = input;
    return Is.object(build) && Is.object(hash) &&
      'digest' in hash && Is.str(hash.digest) && 'parts' in hash && Is.object(hash.parts);
  },
} as const;
