import { DenoSubhostingAPI, Path, pkg, type t } from '../common.ts';

/**
 * Setup routes for deploying and managing sub-hosting instances.
 */
export function routes(path: string, ctx: t.RouteContext) {
  const { app, env } = ctx;
  const subhosting = new DenoSubhostingAPI({ bearerToken: env.deno.accessToken });
  const orgId = env.deno.orgId;
  const join = Path.join;

  /**
   * GET: root info.
   */
  app.get(path, async (c) => {
    const description = `deno:subhosting™️ controller`;

    // const auth = await ctx.auth.verify(c.req.raw);
    // const identity = auth.claims?.userId ?? '';
    // const verified = auth.verified;
    const identity = 'NO_OP:🐷'; // TODO 🐷
    const verified = false;

    const res: t.SubhostingInfo = {
      description,
      pkg,
      auth: { identity, verified },
    };

    return c.json(res);
  });

  /**
   * GET: /orgs
   */
  app.get(join(path, '/projects'), async (c) => {
    /**
     * TODO 🐷
     * - tests: - success
     *          - failure
     */

    const projects = await subhosting.organizations.projects.list(orgId);
    const res: t.SubhostingProjectsInfo = { projects };
    return c.json(res);
  });
}
