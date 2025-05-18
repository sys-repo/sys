import React from 'react';

import { DevArgs } from '../u/mod.ts';
import { Harness } from '../ui/Harness/mod.ts';
import { ModuleList } from '../ui/ModuleList/mod.ts';
import { type t, COLORS, css } from './common.ts';

export type RenderOptions = {
  location?: t.UrlInput;
  badge?: t.ImageBadge;
  hr?: number | t.ModuleListShowHr;
  style?: t.CssInput;
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
) => Promise<React.ReactElement>;

/**
 * Render a harness with the selected `dev=<namespace>`
 * import or an index list of available specs.
 */
export const render: Render = async (pkg, specs, options = {}) => {
  const url = DevArgs.Url.navigate.formatDevFlag(options);
  const spec = await DevArgs.Url.module(url, specs);
  const style = css(options.style ?? { Absolute: 0, backgroundColor: COLORS.WHITE });

  if (spec) {
    return <Harness spec={spec} style={style} />;
  }

  return (
    <ModuleList
      title={pkg.name}
      version={pkg.version}
      imports={specs}
      badge={options.badge}
      hr={options.hr}
      style={style}
    />
  );
};
