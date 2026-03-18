/**
 * @module
 * Tools for managing monorepo workspace deployments to Deno Deploy.
 */
import { type t } from './common.ts';
import { deploy } from './m.deploy/mod.ts';
import { pipeline } from './m.pipeline/mod.ts';
import { stage } from './m.stage/mod.ts';

/** Deno Deploy helper library. */
export const DenoDeploy: t.DenoDeploy.Lib = {
  stage,
  deploy,
  pipeline,
};
