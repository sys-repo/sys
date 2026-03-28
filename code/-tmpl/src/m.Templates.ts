/**
 * Template index:
 */
export const Templates = {
  'm.mod': () => import('../-templates/tmpl.m.mod/.tmpl.ts'),
  'm.mod.ui': () => import('../-templates/tmpl.m.mod.ui/.tmpl.ts'),
  'm.mod.ui.controller': () => import('../-templates/tmpl.m.mod.ui.controller/.tmpl.ts'),
  pkg: () => import('../-templates/tmpl.pkg.deno/.tmpl.ts'),
  'repo': () => import('../-templates/tmpl.repo/.tmpl.ts'),
} as const;

export type TemplateName = keyof typeof Templates;

export const TemplateSourceRoots: Record<TemplateName, string> = {
  'm.mod': 'm.mod',
  'm.mod.ui': 'm.mod.ui',
  'm.mod.ui.controller': 'm.mod.ui.controller',
  pkg: 'pkg.deno',
  repo: 'repo',
} as const;
