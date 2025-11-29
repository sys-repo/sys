import { type t, Crdt, Obj } from '../common.ts';

export function makeDiscoverRefs(path: t.ObjectPath): t.Crdt.Graph.DiscoverRefs {
  return async (e) => {
    const yaml = Obj.Path.get<string>(e.doc.current, path) ?? '';
    return extractCrdtRefs(yaml)
      .map((id) => Crdt.Id.fromUri(id))
      .filter((id) => Crdt.Is.id(id));
  };
}

/**
 * Extract all "crdt:<id>" references from a string,
 * ignoring any that appear inside YAML comments.
 */
function extractCrdtRefs(text: string): readonly t.Crdt.Id[] {
  const re = /crdt:([A-Za-z0-9]+)/g;
  const out: string[] = [];
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

    out.push(`crdt:${m[1]}`);
  }

  return out;
}
