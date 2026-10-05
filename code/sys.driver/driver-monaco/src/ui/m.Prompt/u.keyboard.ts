import { type t } from './common.ts';

export type EnterKeyEvent = {
  readonly modifiers: t.Keyboard.Modifier.Flags;
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
  } satisfies t.Keyboard.Modifier.Flags;

  return {
    modifiers,
    preventDefault() {
      event.preventDefault();
    },
    stopPropagation() {
      event.stopPropagation();
    },
  };
};
