import type { t } from '../common.ts';

/** Presentation is forwarded unchanged; defaults are sm and padding [0, 8, 0, 5]. */
export type Props<Id extends string = string> =
  & Pick<t.BulletList.Props<Id>, 'theme' | 'style' | 'size' | 'itemPadding' | 'columns'>
  & {
    items: readonly Item<Id>[];
    /**
     * Undefined: commands without pressed state. Defined (including []): caller-controlled aria-pressed.
     * Ordinary Tab navigation, not radio/listbox semantics. Selection is never auto-toggled.
     */
    selected?: t.BulletList.Selected<NoInfer<Id>>;
  };

/** Stable unique ID and explicit non-interactive label; callers supply a non-empty name. */
export type Item<Id extends string = string> =
  & Pick<t.BulletList.Item.Action<Id>, 'id' | 'enabled'>
  & {
    /**
     * Forwarded unchanged to BulletList: strings use Text.Label's inline Markdown subset, including
     * CommonMark escapes/entities. For literal notation use ``<span>{'**literal** `code`'}</span>``.
     * Other non-interactive React nodes pass through unchanged.
     */
    label: t.ReactNode;
    /** One method per eligible activation, including reselection; callers own async/errors. */
    onActivate: t.BulletList.Activate.Handler<NoInfer<Id>>;
  };
