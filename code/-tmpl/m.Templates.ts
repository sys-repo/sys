/**
 * Template index:
 */
export const Templates = {
  'm.mod': () => import('./m.mod/.tmpl.ts'),
  'm.mod.ui': () => import('./m.mod.ui/.tmpl.ts'),
  'pkg.deno': () => import('./pkg.deno/.tmpl.ts'),
} as const;

export type TemplateName = keyof typeof Templates;
