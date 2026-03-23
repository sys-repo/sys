import { readIdentifier, skipString, skipTrivia, startsWithWord } from './u.lex.ts';

function listExportsDefault(source: string, index: number): boolean {
  let cursor = index + 1;
  while (cursor < source.length) {
    cursor = skipTrivia(source, cursor);
    if (source[cursor] === '}') return false;
    const local = readIdentifier(source, cursor);
    if (!local.value) return false;
    cursor = skipTrivia(source, local.next);
    let exported = local.value;
    if (startsWithWord(source, cursor, 'as')) {
      cursor = skipTrivia(source, cursor + 2);
      const alias = readIdentifier(source, cursor);
      if (!alias.value) return false;
      exported = alias.value;
      cursor = alias.next;
    }
    if (exported === 'default') return true;
    cursor = skipTrivia(source, cursor);
    if (source[cursor] === ',') {
      cursor++;
      continue;
    }
    if (source[cursor] === '}') return false;
  }
  return false;
}

export function hasDefaultExport(source: string): boolean {
  let cursor = 0;

  while (cursor < source.length) {
    cursor = skipTrivia(source, cursor);
    if (cursor >= source.length) break;

    const char = source[cursor];
    if (char === '\'' || char === '"' || char === '`') {
      cursor = skipString(source, cursor, char);
      continue;
    }

    if (!startsWithWord(source, cursor, 'export')) {
      cursor++;
      continue;
    }

    cursor = skipTrivia(source, cursor + 'export'.length);

    if (startsWithWord(source, cursor, 'default')) return true;
    if (startsWithWord(source, cursor, 'type')) {
      cursor += 'type'.length;
      continue;
    }
    if (source[cursor] === '{' && listExportsDefault(source, cursor)) return true;

    cursor++;
  }

  return false;
}
