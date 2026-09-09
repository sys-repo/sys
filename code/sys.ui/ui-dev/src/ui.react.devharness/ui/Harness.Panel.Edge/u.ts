import { Color, Is, type t } from '../common.ts';

export const Wrangle = {
  borderStyle(props?: t.DevRenderPropsEdge) {
    const color = props?.border?.color;
    if (color === undefined) return undefined;
    const value = Is.str(color) ? color : Color.toGrayAlpha(color);
    return `solid 1px ${value}`;
  },
};
