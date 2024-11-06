import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Props: <Component>
 */
export type CommonInfoProps<F extends string = string, D extends O = {}> = {
  title?: t.PropListProps['title'];
  width?: t.PropListProps['width'];
  fields?: (F | undefined | null)[];
  data?: D;
  margin?: t.CssEdgesInput;
  stateful?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Prop: Data
 */
export type InfoVisible<InfoField extends string = string> = {
  value?: boolean;
  enabled?: boolean;
  label?: string;
  filter?: (e: { visible: boolean; fields: InfoField[] }) => InfoField[];
};

/**
 * Events
 */
export type InfoVisibleToggleHandler = (e: InfoVisibleToggleArgs) => void;
export type InfoVisibleToggleArgs = { prev: boolean; next: boolean };
