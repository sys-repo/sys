import { Type } from '../common.ts';

/**
 * File-share:
 */
export const Fileshare = Type.Object(
  {
    debug: Type.Optional(Type.Boolean({ description: 'Show debug view', default: false })),

    /** Identifier of the CRDT document (e.g. "crdt:new") */
    doc: Type.String({ description: 'CRDT document identifier' }),

    /**
     * Path within the document.
     * Either a slash-delimited string (e.g. "files/foo"),
     * or an array of segments (i.e. t.ObjectPath).
     */
    path: Type.Union(
      [
        Type.String({ description: 'Slash-delimited path' }),
        Type.Array(Type.String({ description: 'Single path segment' }), {
          description: 'Array of path segments',
        }),
      ],
      { description: 'Document path inside the CRDT' },
    ),
  },
  { additionalProperties: false },
);
