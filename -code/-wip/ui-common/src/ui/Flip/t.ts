import type { t } from '../common.ts';

type ElementInput = JSX.Element | null | false;

export type FlipProps = {
  flipped?: boolean;
  speed?: t.Msecs;
  front?: ElementInput;
  back?: ElementInput;
  style?: t.CssValue;
};
