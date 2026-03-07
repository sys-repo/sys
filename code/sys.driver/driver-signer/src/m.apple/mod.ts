/**
 * @module
 * Apple driver-signer surface for codesign/notarize orchestration.
 */
import type { t } from './common.ts';
import { capabilities } from './u.capabilities.ts';
import { run } from './u.run.ts';

export const AppleSigner: t.AppleSigner.Lib = {
  capabilities,
  run,
};
