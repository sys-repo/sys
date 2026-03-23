/**
 * @module
 * Canonical `deps.yaml` manifest helpers for ESM dependencies.
 */
import type { t } from './common.ts';

const notReady = (method: string): never => {
};

export const Deps: t.EsmDeps.Lib = {
  from: async () => notReady('from'),
  toYaml: () => notReady('toYaml'),
  toEntry: () => notReady('toEntry'),
  findImport: () => notReady('findImport'),
};
