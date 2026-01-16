import { type t } from './common.ts';
import { SlugUrl as Url } from './m.Url.ts';
import { loadTreeFromEndpoint } from './u.loadTreeFromEndpoint.ts';

/**
 * Slug client ingress (HTTP + schema validation).
 */
export const SlugClient: t.SlugClientLib = {
  Url,
  loadTreeFromEndpoint,
};
