import { type t } from './common.ts';

export type EnterKeyEvent = {
  readonly modified: boolean;
  readonly modifiers: t.KeyboardModifierFlags;
  preventDefault(): void;
  stopPropagation(): void;
};

export const toEnterKeyEvent = (event: t.Monaco.I.IKeyboardEvent): EnterKeyEvent | undefined => {
  const e = event as t.Monaco.I.IKeyboardEvent & {
    browserEvent?: {
      key?: string;
      code?: string;
      shiftKey?: boolean;
      altKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
    };
  };

  const isEnter = e.browserEvent?.key === 'Enter' || e.browserEvent?.code === 'Enter';
  if (!isEnter) return undefined;

  const modifiers = {
    shift: !!e.browserEvent?.shiftKey,
    alt: !!e.browserEvent?.altKey,
    ctrl: !!e.browserEvent?.ctrlKey,
    meta: !!e.browserEvent?.metaKey,
  } satisfies t.KeyboardModifierFlags;

  return {
    modified: modifiers.ctrl || modifiers.meta,
    modifiers,
    preventDefault: e.preventDefault ?? (() => {}),
    stopPropagation: e.stopPropagation ?? (() => {}),
  };
};
