import type { t } from './common.ts';

/**
 * A list of <Bullet>'s.
 */
export namespace BulletList {
  /** Public BulletList module surface and helper functions. */
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly toggle: (selected: Selected | undefined, id: string) => string[];
  };
  /** Selected ids, as a single id or multi-select list. */
  export type Selected = t.StringId | t.StringId[];

  /** Clickable bullet item with optional label and enabled state. */
  export type SelectableItem = {
    kind?: 'item';
    id: t.StringId;
    label?: t.ReactNode;
    enabled?: boolean;
  };
  /** Non-selectable content row rendered inline in the list. */
  export type ContentItem = {
    kind: 'content';
    key: t.StringId;
    render: () => t.ReactNode;
  };
  /** Union of all row variants supported by BulletList. */
  export type Item = SelectableItem | ContentItem;

  /** Component props for rendering a bullet list and selection state. */
  export type Props = {
    items: Item[];
    selected?: Selected;
    columns?: number;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onSelect?: OnSelectHandler<any>;
  };

  /** Selection event handler signature for bullet-item presses. */
  export type OnSelectHandler<Id extends string = string> = (e: OnSelectArgs<Id>) => void;
  /** Selection event payload including id and keyboard modifier state. */
  export type OnSelectArgs<Id extends string = string> = {
    readonly id: Id;
    readonly modifiers: t.KeyboardModifierFlags;
    readonly is: { readonly command: boolean; readonly modified: boolean };
  };
}
