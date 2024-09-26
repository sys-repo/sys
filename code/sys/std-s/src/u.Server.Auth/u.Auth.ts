import type { t } from './common.ts';
import { ctx } from './u.Auth.ctx.ts';

/**
 * Helpers for auth (authentication and authorization).
 */
export const Auth: t.ServerAuth = {
  ctx,
};
