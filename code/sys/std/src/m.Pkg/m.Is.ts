import { type t, D, Is } from './common.ts';

export const PkgIs: t.PkgIsLib = {
  unknown(input) {
    if (Is.object(input)) {
      const { name, version } = input;
      if (!Is.str(name)) return true;
      if (!Is.str(version)) return true;
      const UNKNOWN = D.unknown();
      return name === UNKNOWN.name && version === UNKNOWN.version;
    }
    if (typeof input !== 'string') return true;
    const UNKNOWN = D.unknown();
    return input === `${UNKNOWN.name}@${UNKNOWN.version}`;
  },

  pkg(input: any): input is t.Pkg {
    if (!Is.object(input)) return false;
    const pkg = input as t.Pkg;
    return Is.str(pkg.name) && Is.str(pkg.version);
  },

  dist(input: any): input is t.DistPkg {
    if (!wrangle.distBase(input)) return false;
    const dist = input as t.DistPkg;
    if (!Is.object(dist.build.hash)) return false;
    if (!Is.str(dist.build.hash.policy)) return false;
    if (dist.build.hash.ignore !== undefined) {
      const ignore = dist.build.hash.ignore;
      if (!Is.object(ignore)) return false;
      if (ignore.format !== 'gitignore') return false;
      if (!Array.isArray(ignore.rules)) return false;
      if (!ignore.rules.every((rule) => Is.str(rule))) return false;
      if (!is.sha256Hash(ignore.digest)) return false;
    }
    if (dist.build.sign !== undefined) {
      if (!Is.object(dist.build.sign)) return false;
      if (!Is.str(dist.build.sign.path)) return false;
      if (dist.build.sign.scheme !== 'Ed25519') return false;
      if (dist.build.sign.key !== undefined && !Is.str(dist.build.sign.key)) return false;
    }
    if (!is.sha256Hash(dist.hash.digest)) return false;

    const values = Object.values(dist.hash.parts);
    return values.every((value) => {
      if (!Is.str(value)) return false;
      const hash = value.split(':size=')[0];
      return is.sha256Hash(hash);
    });
  },

  distCompat(input: any): input is t.DistPkg | t.DistPkgLegacy {
    return wrangle.distBase(input);
  },
};

/**
 * Helpers:
 */
const wrangle = {
  distBase(input: any) {
    if (!Is.object(input)) return false;

    const dist = input as t.DistPkg | t.DistPkgLegacy;
    if (!Is.str(dist.type)) return false;
    if (dist.pkg !== undefined && !PkgIs.pkg(dist.pkg)) return false;
    return Is.object(dist.build) && Is.str(dist.hash.digest) && Is.object(dist.hash.parts);
  },
} as const;

const is = {
  sha256Hash(input: unknown): input is t.StringHash {
    if (!Is.str(input)) return false;
    return /^sha256-[0-9a-f]{64}$/.test(input);
  },
} as const;
