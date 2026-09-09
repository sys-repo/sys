import type { t } from '../common.ts';

/**
 * Cell descriptor and config paths relative to the Cell root.
 */
export const CellPaths: t.Cell.MetadataPaths = {
  metaDir: '-config/@sys.cell',
  descriptor: '-config/@sys.cell/cell.yaml',
  configDir: '-config',
  legacy: {
    descriptor: '-cell/cell.yaml',
  },
};
