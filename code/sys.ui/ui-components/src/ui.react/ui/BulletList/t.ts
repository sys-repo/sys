import type { t } from './common.ts';

/**
 * A semantic list of actions or caller-controlled choices.
 */
export declare namespace BulletList {
  /** Public renderer and pure caller-owned selection helper. */
  export type Lib = {
    readonly UI: <Id extends string = string>(props: Props<Id>) => t.ReactNode;
    readonly toggle: <Id extends string = string>(
      selected: Selected<Id> | undefined,
      id: Id,
    ) => readonly Id[];
  };

  /** A controlled choice or set; undefined omits selection semantics, while [] selects nothing. */
  export type Selected<Id extends string = string> = Id | readonly Id[];

  /** One grid cell; actionable IDs and content keys must be unique and stable across the list. */
  export type Item<Id extends string = string> = Item.Action<Id> | Item.Content;

  /** List props; activation never changes selection without a caller update. */
  export type Props<Id extends string = string> = {
    items: readonly Item<Id>[];
    selected?: Selected<Id>;
    columns?: number;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onActivate?: Activate.Handler<NoInfer<Id>>;
  };

  /**
   * Action and content cells.
   */
  export namespace Item {
    /** Non-interactive rich label, falling back to id; the caller supplies a non-empty name. */
    export type Action<Id extends string = string> = {
      kind?: 'item';
      id: Id;
      label?: t.ReactNode;
      enabled?: boolean;
    };
    /** Content outside a row button; descendants retain their own interaction. */
    export type Content = {
      kind: 'content';
      key: string;
      render: () => t.ReactNode;
    };
  }

  /**
   * Activation intent, independent of caller selection policy.
   */
  export namespace Activate {
    /** Primary release or keyboard/assistive activation, delegated to Button. */
    export type Handler<Id extends string = string> = (e: Args<Id>) => void;
    /** Delivered activation modifiers; Button's generated keyboard click does not retain key flags. */
    export type Args<Id extends string = string> = {
      readonly id: Id;
      readonly modifiers: t.Keyboard.Modifier.Flags;
      readonly is: { readonly command: boolean; readonly modified: boolean };
    };
  }
}
