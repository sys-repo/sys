import { type t } from './common.ts';

export type EnterKeyEvent = {
  readonly modified: boolean;
  readonly modifiers: t.KeyboardModifierFlags;
  preventDefault(): void;
  stopPropagation(): void;
};

export const toEnterKeyEvent = (event: t.Monaco.I.IKeyboardEvent): EnterKeyEvent | undefined => {
  const isEnter = event.browserEvent.key === 'Enter' || event.code === 'Enter';
  if (!isEnter) return undefined;

  const modifiers = {
    shift: event.shiftKey,
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
  } satisfies t.KeyboardModifierFlags;

  return {
    modified: modifiers.ctrl || modifiers.meta,
    modifiers,
    preventDefault() {
      event.preventDefault();
    },
    stopPropagation() {
      event.stopPropagation();
    },
  };
};
