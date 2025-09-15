/**
 * Internal inferred types from local schemas.
 *
 * ⚠️ Not exported from the public API:
 *    JSR rejects publishing "slow types". Consumers should
 *    re-infer from the schemas (e.g. `t.Static<typeof FooSchema>`).
 */
import type { t } from './common.ts';
import { HarnessSchema } from './def/mod.ts';

export type HarnessProps = t.Infer<typeof HarnessSchema>;
