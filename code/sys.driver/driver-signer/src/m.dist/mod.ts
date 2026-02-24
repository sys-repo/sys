/**
 * @module
 * Distribution manifest signer driver for detached sign/verify workflows.
 * Implements the `content-manifest` signer target (for example `dist.json`).
 */
import type { t } from './common.ts';

export const DistSigner: t.DistSigner.Lib = {
  capabilities() {
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
  },

  async run(args) {
    const data: t.Signer.ResultData = {
      target: 'content-manifest',
      mode: args.mode,
    };

    return {
      ok: false,
      data,
      error: { name: 'Error', message: 'DistSigner.run is not implemented yet.' },
      code: 'E_INTERNAL',
      stage: 'internal',
    };
  },
};
