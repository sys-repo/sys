import type React from 'react';
import { type t } from '../common.ts';
import {
  navigationMode,
  toKeyboardEntryChange,
  toNavigationChange,
  toNavigationIntent,
} from './u.event.ts';
import { DataAttr } from './u.render.ts';

export type Handler = React.KeyboardEventHandler<HTMLElement>;

export type HandlerArgs = {
  readonly items: readonly t.KeyValue.Item[];
  readonly cursor?: t.KeyValue.Cursor.Props;
};

export type RootProps = {
  readonly [DataAttr.root]?: 'true';
  readonly tabIndex?: 0;
  readonly onKeyDown?: Handler;
};

export type CursorRootArgs = {
  readonly current: HTMLElement;
  readonly cursor: t.KeyValue.Cursor.Props;
};

/** Convert controlled KeyValue cursor props into a root keyboard navigation handler. */
export function toNavigationHandler(args: HandlerArgs): Handler | undefined {
  const { cursor, items } = args;
  if (!cursor || cursor.enabled === false) return undefined;
  if (!navigationMode(cursor.navigation)) return undefined;
  if (!cursor.onChange) return undefined;

  return (event) => {
    const model = cursor.model ?? {};
    const entry = toKeyboardEntryChange({ event, entry: cursor.entry, model, items });
    if (entry) {
      event.preventDefault();
      cursor.onChange?.(entry);
      return;
    }

    const intent = toNavigationIntent(event, cursor.navigation);
    if (!intent || !model.current) return;

    event.preventDefault();
    const change = toNavigationChange({ model, items, intent });
    if (change) cursor.onChange?.(change);
  };
}

/** Props needed for the hidden DOM-focus root that captures keyboard navigation. */
export function toNavigationRootProps(handler?: Handler): RootProps {
  return {
    [DataAttr.root]: handler ? 'true' : undefined,
    tabIndex: handler ? 0 : undefined,
    onKeyDown: handler,
  };
}

/** Move DOM focus to the nearest KeyValue cursor root after cursor entry succeeds. */
export function focusCursorRoot(args: CursorRootArgs) {
  if (!navigationMode(args.cursor.navigation)) return;
  const root = args.current.closest(`[${DataAttr.root}]`) as Pick<HTMLElement, 'focus'> | null;
  root?.focus?.({ preventScroll: true });
}
