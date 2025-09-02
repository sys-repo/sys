import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * CLI template entry-point.
 */
export type CatalogTmplCli = (opts?: t.CatalogTmplCliOptions) => Promise<void>;
export type CatalogTmplCliOptions = {
  readonly dryRun?: boolean;
  readonly ctx?: O;
};
