/**
 * Internal inferred types from local schemas.
 *
 * ⚠️ Not exported from the public API:
 *    JSR rejects publishing "slow types".
 *    Consumers should re-infer from the schemas (e.g. `t.Infer<typeof FooSchema>`).
 */
import type { t } from './common.ts';
import type { HelloPropsSchema } from './def/mod.ts';

export type HelloProps = t.Infer<typeof HelloPropsSchema>;
