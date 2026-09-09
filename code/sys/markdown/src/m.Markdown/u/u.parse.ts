import {
  Err,
  mdastFromMarkdown,
  mdastGfmFromMarkdown,
  micromarkGfm,
  type t,
} from '../common.ts';
import { flavor } from './u.flavor.ts';

export const parse: t.Markdown.Lib['parse'] = (src = '', options) => {
  try {
    const data = mdastFromMarkdown(src, parseOptions(options));
    return { data };
  } catch (cause) {
    return { error: Err.std('Failed to parse Markdown', { cause }) };
  }
};

function parseOptions(options?: t.Markdown.ParseOptions) {
  if (flavor(options) === 'commonmark') return undefined;
  return {
    extensions: [micromarkGfm()],
    mdastExtensions: [mdastGfmFromMarkdown()],
  };
}
