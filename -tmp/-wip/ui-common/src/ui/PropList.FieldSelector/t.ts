import type { t } from './common.ts';

type FieldInput<T extends string = string> = T | undefined | null;

export type PropListFieldSelectorAction = 'Select' | 'Deselect' | 'Reset:Default' | 'Reset:Clear';

/**
 * Component: <PropsList.FieldSelector>
 */
export type PropListFieldSelectorProps<F extends string = string> = {
  title?: t.PropListTitleInput;
  all?: FieldInput<F>[];
  selected?: FieldInput<F>[];
  defaults?: FieldInput<F>[];

  resettable?: boolean;
  indexes?: boolean;

  indent?: number;
  switchColor?: string | number;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  onClick?: PropListFieldSelectorClickHandler;
};

export type PropListFieldSelectorClickHandler = (e: PropListFieldSelectorClickHandlerArgs) => void;
export type PropListFieldSelectorClickHandlerArgs<F extends string = string> = {
  action: PropListFieldSelectorAction;
  field?: F;
  value: { prev?: F[]; next?: F[] };
  next<T extends string>(defaults?: FieldInput<T>[]): T[] | undefined;
  as<T extends string>(): PropListFieldSelectorClickHandlerArgs<T>;
};
