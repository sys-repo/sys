import { Root } from './r.root/mod.ts';
import { Subhosting } from './r.subhosting/mod.ts';

/**
 * Index of routes.
 */
export const Routes = {
  root: Root.routes,
  subhosting: Subhosting.routes,
} as const;
