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

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onSelect?: OnSelectHandler;
  };

  export type OnSelectHandler = (e: OnSelectArgs) => void;
  export type OnSelectArgs = {
    readonly id: t.StringId;
    readonly modifiers: t.KeyboardModifierFlags;
    readonly is: { readonly command: boolean; readonly modified: boolean };
  };
}
