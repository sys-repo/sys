import type { t } from '../common.ts';

type K = t.TextSyntaxTokenKind;
type B = t.TextSyntaxBraceKind;

/**
 * Simple tokenizer that matches <Value> and {Object} braces.
 *
 * Ref:
 *    https://github.com/microsoft/ts-parsec
 */
export const DefaultTokenizer: t.TextSyntaxTokenizer = (text) => {
  text = text ?? '';
  const parts: t.TextSyntaxToken[] = [];
  let buffer = '';

  const push = (kind: K, text: string, within?: B) => {
    parts.push({ text, kind, within });
  };

  const pushBuffer = (kind: K, within?: B) => {
    if (buffer.length === 0) return;
    push(kind, buffer, within);
    buffer = ''; // NB: reset.
  };

  const next = factory(text);
  let done = false;
  const within: B[] = [];

  while (!done) {
    const current = next();
    const { char, is } = current;
    done = is.complete;
    if (typeof char !== 'string') continue;

    if (is.brace.any) {
      pushBuffer('Word', within[within.length - 1]);
      if (is.brace.open && is.brace.kind) within.push(is.brace.kind);
      if (is.brace.close) within.pop();

      push('Brace', char);
    } else if (current.is.colon) {
      pushBuffer('Predicate');
      push('Colon', char);
    } else {
      buffer += char;
    }
  }

  pushBuffer('Word'); // Clear buffer in case there were no "brace" characters.
  return { text, parts };
};

/**
 * [Helpers]
 */

function factory(text: string) {
  let index = 0;

  return () => {
    const char = text[index];

    const is = {
      brace: Brace.toFlags(char),
      colon: char === ':',
      complete: index >= text.length - 1,
    };

    index++;
    return { char, index: index - 1, is };
  };
}

const Brace = {
  OPEN: ['<', '{', '['],
  CLOSE: ['>', '}', ']'],
  toFlags(char: string) {
    const open = Brace.OPEN.includes(char);
    const close = Brace.CLOSE.includes(char);
    return {
      open,
      close,
      none: !(open && close),
      any: open || close,
      kind: Brace.toKind(char),
    };
  },
  toKind(char: string): B | undefined {
    if (['<', '>'].includes(char)) return '<>';
    if (['[', ']'].includes(char)) return '[]';
    if (['{', '}'].includes(char)) return '{}';
    return;
  },
};
