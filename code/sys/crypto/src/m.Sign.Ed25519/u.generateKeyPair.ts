import type { t } from './common.ts';

export const generateKeyPair: t.SignEd25519.Lib['generateKeyPair'] = async (args = {}) => {
  const { extractable = false } = args;
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, extractable, ['sign', 'verify']);
  return {
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
  };
};
