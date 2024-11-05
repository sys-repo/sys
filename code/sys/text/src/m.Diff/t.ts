export type TextCharDiff = {
  kind: TextDiffKind;
  index: number;
  value: string;
};
export type TextDiffKind = 'Added' | 'Deleted' | 'Unchanged';
