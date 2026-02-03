import { type t } from './common.ts';

const REGEX = /^(?:sha256-)?([0-9a-f]{64})$/;

export const Sha256: t.ShardSha256Lib = {
  normalizeHex(input) {
    const m = input.match(REGEX);
    if (!m) throw new Error(`Invalid sha256 hex: "${input}"`);
    return m[1].toLowerCase() as t.Sha256Hex;
  },
};
