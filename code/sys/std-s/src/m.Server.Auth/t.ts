import type { t } from './common.ts';
export type { AuthTokenClaims } from '@privy-io/server-auth';

/**
 * Authentication Library
 */
export type ServerAuth = {
  ctx(appId: string, appSecret: string): AuthCtx;
};

export type AuthCtx = {
  verify(input: string | Request): Promise<t.AuthVerification>;
};

/**
 * Response emitted from the Auth.verify(..) method.
 */
export type AuthVerification = {
  verified: boolean;
  user: string;
  claims?: t.AuthTokenClaims;
  error?: string;
};
