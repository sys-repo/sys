import { DevKeyboard } from '../u/Keyboard/mod.ts';
import { Harness } from '../ui/Harness/mod.ts';
import { ModuleList } from '../ui/ModuleList/mod.ts';
import { COLORS, DevWrangle, type t } from './common.ts';

export type RenderOptions = {
  location?: t.UrlInput;
  badge?: t.ImageBadge;
  hrDepth?: number;
  keyboard?: boolean;
  style?: t.CssValue;
};

/**
 * Render a harness with the selected `dev=<namespace>`
 * import or an index list of available specs.
 *
 * NOTE: This is overridden with a more complex implementation
 *      in the [@sys/ui-common] package.
 */
export type Render = (
  pkg: { name: string; version: string },
  specs: t.SpecImports,
  options?: RenderOptions,
) => Promise<JSX.Element>;

/**
 * Render a harness with the selected `dev=<namespace>`
 * import or an index list of available specs.
 */
export const render: Render = async (pkg, specs, options = {}) => {
  const { keyboard = true } = options;
  const url = DevWrangle.Url.navigate.formatDevFlag(options);
  const spec = await DevWrangle.Url.module(url, specs);
  const style = options.style ?? { Absolute: 0, backgroundColor: COLORS.WHITE };

  if (keyboard) DevKeyboard.listen({});

  if (spec) {
    return <Harness spec={spec} style={style} />;
  }

  return (
    <ModuleList
      title={pkg.name}
      version={pkg.version}
      imports={specs}
      badge={options.badge}
      hrDepth={options.hrDepth}
      style={style}
    />
  );
};
