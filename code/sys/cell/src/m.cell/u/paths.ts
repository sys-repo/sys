import type { t } from '../common.ts';

/**
 * Cell metadata/control paths relative to the Cell root.
 */
export const CellPaths: t.Cell.MetadataPaths = {
  metaDir: '-cell',
  descriptor: '-cell/cell.yaml',
  configDir: '-cell/-config',
  legacy: {
    descriptor: '-config/@sys.cell/cell.yaml',
  },
};
