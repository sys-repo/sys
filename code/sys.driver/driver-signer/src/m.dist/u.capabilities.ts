import type { t } from './common.ts';

export const capabilities: t.DistSigner.Lib['capabilities'] = () => {
  return {
    target: 'content-manifest',
    sign: true,
    verify: true,
    detachedSignature: true,
    embeddedSignature: false,
    notarize: false,
    staple: false,
    timestamp: false,
  };
};
