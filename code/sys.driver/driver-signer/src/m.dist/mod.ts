/**
 * @module
 * Distribution manifest signer driver for detached sign/verify workflows.
 * Implements the `content-manifest` signer target (for example `dist.json`).
 * For canonical `dist.json`, sign/sign-verify defaults to writing `build.sign` descriptor metadata.
 */
import type { t } from './common.ts';
import { capabilities } from './u.capabilities.ts';
import { run } from './u.run.ts';

/** Dist signer runtime surface. */
export const DistSigner: t.DistSigner.Lib = {
  capabilities,
  run,
};
