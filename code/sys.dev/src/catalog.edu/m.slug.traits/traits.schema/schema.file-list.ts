import { type t, Type as T } from './common.ts';

/**
 * Properties: File List.
 */
export const FileListPropsSchemaInternal = T.Object(
  {
    /**
     * Optional human-readable label for this list.
     */
    name: T.Optional(T.String({ description: 'Optional display name for the file list.' })),

    /**
     * Array of filesystem path references.
     * Paths are implementation-defined strings (no enforced pattern here).
     */
    files: T.Array(T.String({ description: 'File path reference.' }), {
      description: 'List of file path references.',
    }),
  },
  {
    $id: 'trait.file-list.props',
    title: 'File List Properties',
    additionalProperties: false,
  },
);

/**
 * Public widened export (JSR-safe: explicit t.TSchema surface).
 */
export const FileListPropsSchema: t.TSchema = FileListPropsSchemaInternal;
