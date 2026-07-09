import type React from 'react';
import { type t } from '../common.ts';
import { navigationMode, toNavigationChange, toNavigationIntent } from './u.event.ts';
import { Data } from './u.render.ts';

export type Handler = React.KeyboardEventHandler<HTMLElement>;

export type HandlerArgs = {
  readonly items: readonly t.KeyValue.Item[];
  readonly focus?: t.KeyValue.Focus.Props;
};

export type RootProps = {
  readonly [Data.root]?: 'true';
  readonly tabIndex?: -1;
  readonly onKeyDown?: Handler;
};

export type FocusRootArgs = {
  readonly current: HTMLElement;
  readonly focus: t.KeyValue.Focus.Props;
};

/** Convert controlled KeyValue focus props into a root keyboard navigation handler. */
export function toNavigationHandler(args: HandlerArgs): Handler | undefined {
  const { focus, items } = args;
  if (!focus || focus.enabled === false) return undefined;
  if (!navigationMode(focus.navigation)) return undefined;
  if (!focus.onChange) return undefined;

  return (event) => {
    const intent = toNavigationIntent(event, focus.navigation);
    const model = focus.model ?? {};
    if (!intent || !model.active) return;

    event.preventDefault();
    const change = toNavigationChange({ model, items, intent });
    if (change) focus.onChange?.(change);
  };
}

/** Props needed for the hidden DOM-focus root that captures keyboard navigation. */
export function toNavigationRootProps(handler?: Handler): RootProps {
  return {
    [Data.root]: handler ? 'true' : undefined,
    tabIndex: handler ? -1 : undefined,
    onKeyDown: handler,
  };
}

/** Move DOM focus to the nearest KeyValue focus root after focus-entry succeeds. */
export function focusNavigationRoot(args: FocusRootArgs) {
  if (!navigationMode(args.focus.navigation)) return;
  const root = args.current.closest(`[${Data.root}]`) as Pick<HTMLElement, 'focus'> | null;
  root?.focus?.({ preventScroll: true });
}
