import type { t } from './common.ts';

export const Selection = {
  /**
   * Retrieve a new selection by moving back through spaces.
   */
  expandBack(textbox: t.TextInputRef, options: { cycle?: boolean } = {}) {
    const { value, selection } = textbox.current;
    const { cycle = false } = options;

    const index = wrangle.firstSpaceBeforeIndex(value, selection.start - 1);
    const start = index < 0 ? 0 : index + 1;
    const end = value.length;

    if (Selection.isFullySelected(value, selection)) {
      if (cycle) textbox.caretToEnd();
    } else {
      textbox.select(start, end);
    }
  },

  /**
   * Toggle bewtween no selection (caret to end) and fully selected text.
   */
  toggleFull(textbox: t.TextInputRef) {
    const { value, selection } = textbox.current;
    if (Selection.isFullySelected(value, selection)) {
      textbox.caretToEnd();
    } else {
      textbox.selectAll();
    }
  },

  /**
   * Determine if the entire set of text is selected.
   */
  isFullySelected(text: string, selection: t.TextInputSelection) {
    return selection.start === 0 && selection.end === text.length;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  firstSpaceBeforeIndex(text: string, index: number): number {
    text = text.slice(0, index);
    for (let i = index - 1; i >= 0; i--) {
      if (text[i] === ' ') return i;
    }
    return -1;
  },
} as const;
