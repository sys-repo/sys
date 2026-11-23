import { Color, Is, type t } from '../common.ts';

export const Wrangle = {
  borderStyle(props?: t.DevRenderPropsEdge, fallback?: t.DevRenderPropsEdge['border']['color']) {
    const color = props?.border?.color ?? fallback;
    if (color === undefined) return undefined;
    const value = Is.str(color) ? color : Color.toGrayAlpha(color);
    return `solid 1px ${value}`;
  },
};
