import type { t } from '../common.ts';

/** Register stylesheet declarations on each committed render; return no cleanup or receipt. */
export type UseStylesheetRule = (
  selector: string,
  style: t.Style.Value | t.Style.Value[],
  options?: t.CssDom.RuleOptions,
) => void;
