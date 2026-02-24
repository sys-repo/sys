import type { t } from './common.ts';
import { toArrayBuffer } from './u.bytes.ts';

export const sign: t.SignEd25519.Lib['sign'] = async (args) => {
  const bytes = toArrayBuffer(args.bytes);
  const sig = await crypto.subtle.sign('Ed25519', args.privateKey, bytes);
  return new Uint8Array(sig);
};
