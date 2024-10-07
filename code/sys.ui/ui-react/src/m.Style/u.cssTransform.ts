import { css as emotionCss } from '@emotion/react';
import { R, type t } from './common.ts';
import { Is } from './u.ts';

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a React element.
 */
export const css: t.CssTransformer = (...input) => {
  let list: t.SerializedStyles[] = [];
  (input.flat() as t.CssValue[]).forEach((item) => {
    if (Is.serizlisedStyle(item)) return list.push(item);
    if (Is.reactCssObject(item)) return list.push(item.css);
    list.push(emotionCss(processTemplates(item) as any));
  });
  list = R.uniq(list);
  const css = list.length === 1 ? list[0] : emotionCss(list);
  return { css };
};

/**
 * Apply common CSS templates (desiganted by capital letter field names)
 * converting the object into standard [CssProperties].
 *
 * For example: { Absolute: 0 }
 */
export function processTemplates(input: t.CssValue): t.CssProperties {
  return input as t.CssProperties;
}
