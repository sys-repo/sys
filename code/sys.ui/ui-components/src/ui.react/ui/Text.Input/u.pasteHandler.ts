import { type t, D } from './common.ts';

type P = t.TextInput.Props;
type H = HTMLInputElement;

export function pasteHandler(
  props: P,
  args: {
    focused: boolean;
    selectionRef: React.RefObject<{ start: number; end: number }>;
  },
) {
  const { focused, selectionRef } = args;
  const { readOnly = D.readOnly } = props;

  return (e: React.ClipboardEvent<H>) => {
    // If read-only or no custom paste handler, fall back to normal behaviour.
    if (readOnly || !props.onPaste) return;

    const input = e.currentTarget;
    const value = input.value;
    const text = e.clipboardData.getData('text');

    let cancelled = false;
    let replacement = text;

    const payload: t.TextInput.PasteArgs = {
      text,
      modify(next: string) {
        replacement = next;
      },
      cancel() {
        cancelled = true;
        e.preventDefault();
        e.stopPropagation();
      },
    };

    // Let consumer inspect/modify/cancel.
    props.onPaste(payload);

    if (cancelled) return;

    // Compute the insertion point.
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;

    const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;

    // Take control of the paste (prevent browser's default insertion).
    e.preventDefault();

    // Apply to DOM so caret + selectionRef stay in sync immediately.
    input.value = nextValue;

    const caret = start + replacement.length;
    input.selectionStart = caret;
    input.selectionEnd = caret;
    selectionRef.current = { start: caret, end: caret };

    // If no change handler, we can't propagate the new value upstream.
    if (!props.onChange) return;

    // Fire the standard change payload so the parent can update `value`.
    props.onChange({
      value: nextValue,
      focused,
      synthetic: e as unknown as React.ChangeEvent<H>,
      input,
      cancel() {
        e.preventDefault();
        e.stopPropagation();
      },
    });
  };
}
