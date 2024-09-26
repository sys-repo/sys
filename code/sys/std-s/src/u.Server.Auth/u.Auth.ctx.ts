import { PrivyClient, type t } from './common.ts';

/**
 * Factory: create a new Auth context.
 */
export const ctx: t.ServerAuth['ctx'] = (appId, appSecret) => {
  const privy = new PrivyClient(appId, appSecret);
  return {
    /**
     * Verify a user's access token (JWT)
     * https://docs.privy.io/guide/server/authorization/verification#verifying-the-user-s-access-token
     */
    async verify(input): Promise<t.AuthVerification> {
      const token = wrangle.accessToken(input);
      if (!token) return { verified: false, user: '' };
      try {
        const claims = await privy.verifyAuthToken(token);

        /**
         * Auth roles/rules as meta-data.
         * https://docs.privy.io/guide/server/users/set-custom-metadata#setting-custom-metadata-for-a-single-user
         */
        // privy.setCustomMetadata()
        // const did = 'did:xxx'
        // const u = privy.getUser(did)

        const user = claims.userId || '';
        const verified = true;
        return { verified, user, claims };
      } catch (err: unknown) {
        const error = (err as Error).message;
        const verified = false;
        return { verified, user: '', error };
      }
    },
  };
};

/**
 * Helpers
 */
const wrangle = {
  accessToken(input: string | Request) {
    const text = typeof input === 'string' ? input : input.headers.get('Authorization') ?? '';
    return text.replace(/^Bearer /, '').trim();
  },
} as const;
