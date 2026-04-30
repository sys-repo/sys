export type CellTemplateName = keyof typeof ROOTS;

export const ROOTS = {
  default: 'cell.default',
} as const;

export const names = Object.keys(ROOTS) as CellTemplateName[];
