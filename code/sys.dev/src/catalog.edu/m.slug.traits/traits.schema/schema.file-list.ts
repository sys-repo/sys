import { type t, Pattern, Type as T } from './common.ts';

/**
 * Item: File List entry (object form).
 * Minimal common shape for a single file reference.
 */
export const FileListItemSchemaInternal = T.Object(
  {
    ref: T.String({ description: 'File reference string for this item.' }),
  },
  {
    $id: 'trait.file-list.item',
    title: 'File List Item',
    additionalProperties: false,
  },
);

/** A single file reference, either a string path or an object `{ ref: string }`. */
const FileListEntrySchemaInternal = T.Union(
  [T.String({ description: 'File path reference.' }), FileListItemSchemaInternal],
  { description: 'File path or an object with a ref field.' },
);

/**
 * Properties: File List.
 */
export const FileListPropsSchemaInternal = T.Object(
  {
    id: T.Optional(T.String({ title: 'Formal identifier of the file list.', ...Pattern.Id() })),
    name: T.Optional(T.String({ description: 'Display name for the file list.' })),
    description: T.Optional(T.String({ description: 'Description of the file list.' })),
    files: T.Optional(
      T.Array(FileListEntrySchemaInternal, {
        description: 'List of file references (string or object form).',
      }),
    ),
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
export const FileListItemSchema: t.TSchema = FileListItemSchemaInternal;
