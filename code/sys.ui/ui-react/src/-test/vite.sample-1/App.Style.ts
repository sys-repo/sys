import type { t } from './common.ts';

import { css as emptionCss } from '@emotion/react';

/**
 * Library: CSS-in-JS helpers.
 */
export const Style = {
  css(...props: t.CssProperties[]) {
    /**
     * TODO 🐷
     */

    console.log('props', props);
    // if (props.length > 1) return

    // const merged = props.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    // return merged;

    const css = emptionCss(props as any);
    return { css };
  },
} as const;

export const { css } = Style;
