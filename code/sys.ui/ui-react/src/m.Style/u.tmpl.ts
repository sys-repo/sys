import { type t } from './common.ts';

export const Tmpl: t.StyleTmplLib = {
  transform(input?: t.CssValue): t.CssProperties {
    if (!input) return {};
    return input as t.CssProperties;
  },
} as const;
