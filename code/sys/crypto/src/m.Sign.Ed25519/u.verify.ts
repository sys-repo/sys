import type { t } from './common.ts';
import { toArrayBuffer } from './u.bytes.ts';

export const verify: t.SignEd25519.Lib['verify'] = async (args) => {
  const signature = toArrayBuffer(args.signature);
  const bytes = toArrayBuffer(args.bytes);
  return await crypto.subtle.verify('Ed25519', args.publicKey, signature, bytes);
};
