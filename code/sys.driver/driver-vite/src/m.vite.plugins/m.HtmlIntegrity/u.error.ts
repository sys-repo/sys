import { Is, Json } from './common.ts';

type Context = { htmlFile: string; url?: string };

/** Create plugin diagnostics using only the context the caller actually has. */
export function integrityError(reason: string, context?: Context): Error {
  const file = context ? `${context.htmlFile}: ` : '';
  const url = context?.url;
  const resource = Is.str(url) ? `${Json.stringify(url)}: ` : '';
  return new Error(`[sys:html-integrity] ${file}${resource}${reason}`);
}
