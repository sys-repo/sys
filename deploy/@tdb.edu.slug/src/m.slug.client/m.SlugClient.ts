import { type t } from './common.ts';
import { loadTreeFromEndpoint } from './u.loadTreeFromEndpoint.ts';

/**
 * Slug client ingress (HTTP + schema validation).
 */
export const SlugClient: t.SlugClientLib = {
  loadTreeFromEndpoint,
};
