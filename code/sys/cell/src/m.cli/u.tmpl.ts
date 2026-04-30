import { readTmplText } from '../../-tmpl/u/u.text.ts';

export const Tmpl = {
  /**
   * Import the text helper directly so CLI help does not load template writers.
   */
  minimalDescriptor: () => readTmplText('default', '-config/@sys.cell/cell.yaml'),
} as const;
