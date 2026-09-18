import { Is, type t } from '../common.ts';

export const ast: t.Markdown.IsLib['ast'] = (input): input is t.Markdown.Ast => {
  return Is.record<{ readonly type?: unknown; readonly children?: unknown }>(input) &&
    input.type === 'root' && Is.array(input.children);
};
