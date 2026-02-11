import type { t } from './common.ts';

/**
 * A list of <Bullet>'s.
 */
export namespace BulletList {
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly toggle: (selected: Selected | undefined, id: string) => string[];
  };
  export type Selected = t.StringId | t.StringId[];

  export type Item = {
    id: t.StringId;
    label?: t.ReactNode;
    enabled?: boolean;
  };

  export type Props = {
    items: Item[];
    selected?: Selected;
    columns?: number;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onSelect?: OnSelectHandler<any>;
  };

  export type OnSelectHandler<Id extends string = string> = (e: OnSelectArgs<Id>) => void;
  export type OnSelectArgs<Id extends string = string> = {
    readonly id: Id;
    readonly modifiers: t.KeyboardModifierFlags;
    readonly is: { readonly command: boolean; readonly modified: boolean };
  };
}
