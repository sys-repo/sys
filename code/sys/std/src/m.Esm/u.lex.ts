function isWordBoundary(value: string | undefined): boolean {
  return value === undefined || !/[A-Za-z0-9_$]/.test(value);
}

export function startsWithWord(source: string, index: number, word: string): boolean {
  const end = index + word.length;
  return source.slice(index, end) === word &&
    isWordBoundary(source[index - 1]) &&
    isWordBoundary(source[end]);
}

export function skipString(source: string, index: number, quote: '\'' | '"' | '`'): number {
  let cursor = index + 1;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (quote === '`' && char === '$' && source[cursor + 1] === '{') {
      cursor = skipTemplateExpression(source, cursor + 2);
      continue;
    }
    if (char === quote) return cursor + 1;
    cursor++;
  }
  return cursor;
}

export function skipTemplateExpression(source: string, index: number): number {
  let cursor = index;
  let depth = 1;
  while (cursor < source.length && depth > 0) {
    const char = source[cursor];
    if (char === '\'' || char === '"' || char === '`') {
      cursor = skipString(source, cursor, char);
      continue;
    }
    if (char === '/' && source[cursor + 1] === '/') {
      cursor += 2;
      while (cursor < source.length && source[cursor] !== '\n') cursor++;
      continue;
    }
    if (char === '/' && source[cursor + 1] === '*') {
      cursor += 2;
      while (cursor < source.length && !(source[cursor] === '*' && source[cursor + 1] === '/')) cursor++;
      cursor = Math.min(cursor + 2, source.length);
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') depth--;
    cursor++;
  }
  return cursor;
}

export function skipTrivia(source: string, index: number): number {
  let cursor = index;
  while (cursor < source.length) {
    const char = source[cursor];
    if (/\s/.test(char)) {
      cursor++;
      continue;
    }
    if (char === '/' && source[cursor + 1] === '/') {
      cursor += 2;
      while (cursor < source.length && source[cursor] !== '\n') cursor++;
      continue;
    }
    if (char === '/' && source[cursor + 1] === '*') {
      cursor += 2;
      while (cursor < source.length && !(source[cursor] === '*' && source[cursor + 1] === '/')) cursor++;
      cursor = Math.min(cursor + 2, source.length);
      continue;
    }
    return cursor;
  }
  return cursor;
}

export function readIdentifier(source: string, index: number): { readonly value: string; readonly next: number } {
  const start = index;
  let cursor = index;
  while (cursor < source.length && /[A-Za-z0-9_$]/.test(source[cursor])) cursor++;
  return { value: source.slice(start, cursor), next: cursor };
}
