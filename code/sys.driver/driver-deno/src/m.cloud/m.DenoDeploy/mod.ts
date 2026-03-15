/**
 * @module
 * Tools for managing monorepo workspace deployments to Deno Deploy.
 */
import { type t } from './common.ts';

export const DenoDeploy: t.DenoDeploy.Lib = {
  async stage(_request) {
    throw new Error('DenoDeploy.stage not implemented');
  },

  async deploy(_request) {
    throw new Error('DenoDeploy.deploy not implemented');
  },
};
