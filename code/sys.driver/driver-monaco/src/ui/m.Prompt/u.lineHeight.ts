import { type t, Is, Num } from './common.ts';

export const resolveLineHeight = (args: {
  editor: t.Monaco.Editor;
  monaco?: t.Monaco.Monaco;
  lineHeight?: number;
}) => {
  const input = wrangle.toLineHeight(args.lineHeight);
  if (input !== undefined) return input;

  const option = wrangle.fromEditorOption(args.editor, args.monaco);
  if (option !== undefined) return option;

  throw new Error(
    'Unable to resolve Monaco lineHeight. Pass bind.args.lineHeight or provide bind.args.monaco.',
  );
};

const wrangle = {
  toLineHeight(input: number | undefined) {
    if (!Is.num(input)) return undefined;
    return Num.clamp(1, Num.MAX_INT, Math.trunc(input));
  },

  fromEditorOption(editor: t.Monaco.Editor, monaco?: t.Monaco.Monaco) {
    const id = monaco?.editor?.EditorOption?.lineHeight;
    if (!Is.num(id)) return undefined;
    const getOption = (editor as unknown as { getOption?: (id: number) => unknown }).getOption;
    if (!getOption) return undefined;
    return wrangle.toLineHeight(getOption(id) as number | undefined);
  },
} as const;
