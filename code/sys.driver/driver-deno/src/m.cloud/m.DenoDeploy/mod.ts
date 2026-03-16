/**
 * @module
 * Tools for managing monorepo workspace deployments to Deno Deploy.
 */
import { type t } from './common.ts';
import { deploy } from './m.deploy.ts';
import { stage } from './m.Stage/mod.ts';

/** Deno Deploy helper library. */
export const DenoDeploy: t.DenoDeploy.Lib = {
  stage,
  deploy,
};
