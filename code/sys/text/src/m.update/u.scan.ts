import { type t } from './common.ts';

/** Return the first detected newline style, defaulting to LF. */
export const newlineOf: t.TextUpdate.NewlineOf = (text) => {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n') return '\n';
    if (ch === '\r' && text[i + 1] === '\n') return '\r\n';
  }
  return '\n';
};

/** Return physical line spans without inventing a synthetic final line. */
export const lineSpans: t.TextUpdate.Line.Spans = (text) => {
  const spans: t.TextUpdate.Line.Span[] = [];
  let start = 0;

  const push = (endText: number, endRaw: number, newline: t.TextUpdate.Line.Ending) => {
    spans.push({
      index: spans.length,
      text: text.slice(start, endText),
      raw: text.slice(start, endRaw),
      range: { start, end: endRaw },
      textRange: { start, end: endText },
      newline,
    });
    start = endRaw;
  };

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\r' && text[i + 1] === '\n') {
      push(i, i + 2, '\r\n');
      i += 1;
      continue;
    }
    if (text[i] === '\n') push(i, i + 1, '\n');
  }

  if (start < text.length) push(text.length, text.length, '');
  return spans;
};
