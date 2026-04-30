import { readCellTmplText } from '../../-tmpl/u/u.text.ts';

export const Tmpl = {
  /**
   * Import the text helper directly so CLI help does not load template writers.
   */
  minimalDescriptor: () => readCellTmplText('default', '-config/@sys.cell/cell.yaml'),
} as const;
