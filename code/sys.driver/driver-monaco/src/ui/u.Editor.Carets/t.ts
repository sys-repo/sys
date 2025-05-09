import type { t } from '../common.ts';

export type EditorCarets = t.Lifecycle & {
  readonly $: t.Observable<EditorCaretChanged>;
  readonly editor: t.MonacoCodeEditor;
  readonly current: EditorCaret[];
  identity(id: string): EditorCaret;
  delete(id: string): boolean;
  clear(): EditorCarets;
};

export type EditorCaret = t.Lifecycle & {
  readonly $: t.Observable<EditorCaretChanged>;
  readonly id: string;
  readonly color: string;
  readonly opacity: number;
  readonly selections: t.EditorRange[];
  readonly disposed: boolean;
  change(args: EditorCaretChangeArgs): EditorCaret;
  eq(args: EditorCaretChangeArgs): boolean;
};

export type EditorCaretChangeArgs = {
  selections?: t.EditorRangesInput;
  color?: string;
  opacity?: number; // 0..1
};

export type EditorCaretChanged = {
  id: string;
  current: t.EditorRange[];
  disposed: boolean;
};
