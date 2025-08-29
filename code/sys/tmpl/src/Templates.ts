/**
 * Template index:
 */
export const Templates = {
  'm.mod': () => import('./-tmpl/m.mod/.tmpl.ts'),
  'm.mod.ui': () => import('./-tmpl/m.mod.ui/.tmpl.ts'),
  'pkg.deno': () => import('./-tmpl/pkg.deno/.tmpl.ts'),
} as const;
