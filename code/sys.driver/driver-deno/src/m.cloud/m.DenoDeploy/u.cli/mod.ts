import { create } from './u.create.ts';
import { deploy } from './u.deploy.ts';
import { logs } from './u.logs.ts';

/**
 * Internal owned native Deno Deploy CLI boundary helpers.
 *
 * Keep these dumb and explicit:
 * - build native CLI invocations
 * - enforce cwd/config isolation policy
 * - avoid ambient package-root deploy CLI behavior
 *
 * Do not move orchestration, env resolution, or result parsing here.
 */
export const DeployCli = {
  create,
  deploy,
  logs,
} as const;
