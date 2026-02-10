/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'tdb.edu.slug';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.SlugSheet`]: () => import('../ui/ui.SlugSheet/-spec/-SPEC.tsx'),
  [`${ns}: ui.SlugSheetStack`]: () => import('../ui/ui.SlugSheetStack/-spec/-SPEC.tsx'),
  [`${ns}: ui.TreeHost`]: () => import('../ui/ui.TreeHost/-spec/-SPEC.tsx'),

  [`${ns}: ui.TreeDriver.Tmpl`]: () => import('../ui/ui.TreeDriver.Tmpl/-spec/-SPEC.tsx'),
  [`${ns}: ui.TreeContentDriver`]: () => import('../ui/ui.TreeContentDriver/-spec/-SPEC.tsx'),
  [`${ns}: 🐷 _OLD_: ui.driver.SlugKB`]: () =>
    import('../ui/ui.__Legacy__SlugKbDriver/-spec/-SPEC.tsx'),
  [`${ns}: 🐷 _OLD_: ui.driver.SlugPlayback`]: () =>
    import('../ui/ui.__Legacy__SlugPlaybackDriver/-spec/-SPEC.tsx'),

  [`${ns}.dev: Http.SlugOrigin`]: () => import('../ui/-dev/ui.Http.SlugOrigin/-spec/-SPEC.tsx'),
  [`${ns}.dev: Http.SlugLoader ← (data cards)`]: () =>
    import('../ui/-dev/ui.Http.DataCards/-spec/-SPEC.tsx'),
} as t.SpecImports;
