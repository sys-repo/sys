import { css as toSerializedStyles } from '@emotion/react';
import { R, type t } from './common.ts';
import { Tmpl } from './m.Tmpl.ts';
import { Is } from './u.ts';

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a React element.
 */
export const css: t.CssTransformer = (...input) => {
  let list: t.SerializedStyles[] = [];
  (input.flat() as t.CssValue[]).filter(Boolean).forEach((item) => {
    if (Is.serizlisedStyle(item)) return list.push(item);
    if (Is.reactCssObject(item)) return list.push(item.css);
    list.push(toSerializedStyles(Tmpl.transform(item) as any));
  });
  list = R.uniq(list);
  const css = list.length === 1 ? list[0] : toSerializedStyles(list);
  return { css };
};
