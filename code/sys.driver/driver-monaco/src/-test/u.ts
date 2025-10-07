import YAML from 'yaml';
import type { t } from './common.ts';

type LinePos = { line: number; col: number };

/**
 * Parse YAML and return the first error found.
 * Throws if the source contains no errors.
 */
export function makeYamlError(src: string): t.YamlError {
  const doc = YAML.parseDocument(src);
  if (doc.errors.length === 0)
    throw new Error('makeYamlError: expected a YAML error but none were produced');
  else return doc.errors[0] as t.YamlError;
}

/**
 * Factory for a standard YamlError carrying line/col info.
 * Keeps tests focused on behavior, not boilerplate.
 */
export function makeYamlErrorLinePos(
  message: string,
  line: number,
  startCol: number,
  endCol: number,
  code: t.YamlError['code'] = 'UNEXPECTED_TOKEN',
): t.YamlError & { linePos: [LinePos, LinePos] } {
  return {
    name: 'YAMLParseError',
    code,
    message,
    pos: [0, 1],
    linePos: [
      { line, col: startCol },
      { line, col: endCol },
    ],
  };
}
