/**
 * Template index:
 */
export const Templates = {
  'm.mod': () => import('../-templates/tmpl.m.mod/.tmpl.ts'),
  'm.mod.ui': () => import('../-templates/tmpl.m.mod.ui/.tmpl.ts'),
  'pkg.deno': () => import('../-templates/tmpl.pkg.deno/.tmpl.ts'),
  workspace: () => import('../-templates/tmpl.workspace/.tmpl.ts'),
} as const;

export type TemplateName = keyof typeof Templates;
