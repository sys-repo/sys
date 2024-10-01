import { Env } from './u.cloud/u.server/mod.ts';

const get = (await Env.load()).get;

export const env = {
  /**
   * Deno Cloud
   */
  deno: {
    /**
     * Organization: "sys" (Subhosting)
     * https://docs.deno.com/subhosting/manual
     */
    accessToken: get('DENO_SUBHOSTING_ACCESS_TOKEN'),
    orgId: get('DENO_SUBHOSTING_DEPLOY_ORG_ID'),
  },

  /**
   * Auth: Privy
   */
  privy: {
    appId: get('PRIVY_APP_ID'),
    appSecret: get('PRIVY_APP_SECRET'),
  },
};
