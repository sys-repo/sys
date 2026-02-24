/**
 * @module
 * Distribution manifest signer driver for detached sign/verify workflows.
 * Implements the `content-manifest` signer target (for example `dist.json`).
 */
import type { t } from './common.ts';
import { capabilities } from './u.capabilities.ts';
import { run } from './u.run.ts';

export const DistSigner: t.DistSigner.Lib = {
  capabilities,
  run,
};
