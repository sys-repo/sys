import type { t } from './common.ts';

export const capabilities: t.AppleSigner.Lib['capabilities'] = () => {
  return {
    target: 'apple',
    sign: true,
    verify: true,
    detachedSignature: false,
    embeddedSignature: true,
    notarize: true,
    staple: true,
    timestamp: true,
  };
};
