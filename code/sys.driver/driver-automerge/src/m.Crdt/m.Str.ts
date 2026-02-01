import { type t } from './common.ts';

export const CrdtStr: t.CrdtStrLib = {
  extractRefs,
};

/**
 * Extract all "crdt:<id>" references from a string,
 * ignoring any that appear inside YAML comments.
 */
function extractRefs(text: string): readonly t.Crdt.Id[] {
  const re = /crdt:([A-Za-z0-9]+)/g;
  const out: t.Crdt.Id[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    const matchIndex = m.index;

    // Determine the line this match is on.
    const prevNewline = text.lastIndexOf('\n', matchIndex - 1);
    const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;

    const nextNewline = text.indexOf('\n', matchIndex);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;

    const line = text.slice(lineStart, lineEnd);

    // If there is a "#" before the match on this line, it's a YAML comment.
    const hashPos = line.indexOf('#');
    if (hashPos !== -1) {
      const absoluteHashPos = lineStart + hashPos;
      if (absoluteHashPos <= matchIndex) {
        // Match is inside a comment → skip it.
        continue;
      }
    }

    out.push(`crdt:${m[1]}` as t.Crdt.Id);
  }

  return out;
}
