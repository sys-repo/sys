import { Err, mdastGfmToMarkdown, mdastToMarkdown, type t } from '../common.ts';
import { flavor } from './u.flavor.ts';

export const stringify: t.Markdown.Lib['stringify'] = (ast, options) => {
  try {
    const data = mdastToMarkdown(ast, stringifyOptions(options)) as t.StringMarkdown;
    return { data };
  } catch (cause) {
    return { error: Err.std('Failed to stringify Markdown', { cause }) };
  }
};

function stringifyOptions(options?: t.Markdown.StringifyOptions) {
  if (flavor(options) === 'commonmark') return undefined;
  return {
    extensions: [mdastGfmToMarkdown()],
  };
}
