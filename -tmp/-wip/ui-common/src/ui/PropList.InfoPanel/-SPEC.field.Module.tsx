import { DEFAULTS, pkg, Pkg } from './common.ts';
import { TestRunner } from '../../ui.dev/mod.ts';
import type * as t from './-SPEC.t.ts';

/**
 * Module package.
 */
export function module(_theme?: t.CommonTheme): t.PropListItem {
  return { label: 'Module', value: Pkg.toString(pkg) };
}

/**
 * Test runner.
 */
export function moduleVerify(theme?: t.CommonTheme) {
  const ctx = {};
  return TestRunner.PropList.runner({
    ctx,
    theme,

    infoUrl() {
      const url = new URL(location.origin);
      url.searchParams.set(DEFAULTS.query.dev, `${pkg.name}.tests`);
      return url.href;
    },

    async modules() {
      const { TESTS } = await import('../../test.ui/-TestRunner.TESTS.ts');
      return TESTS.all;
    },
  });
}

/**
 * Component display
 */
export function component(data: t.InfoData['component'], _theme?: t.CommonTheme): t.PropListItem {
  return {
    label: data?.label || 'Component',
    value: data?.name || '(Unnamed)',
  };
}
