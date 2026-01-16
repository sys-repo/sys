import { type t } from './common.ts';
import { loadSlugTreeFromEndpoint } from './u.loadSlugTreeFromEndpoint.ts';

/**
 * Slug client ingress (HTTP + schema validation).
 */
export const SlugClient: t.SlugClientLib = {
  loadSlugTreeFromEndpoint,
};
