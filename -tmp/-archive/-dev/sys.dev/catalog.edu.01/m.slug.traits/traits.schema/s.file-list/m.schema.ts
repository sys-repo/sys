import { type t, Pattern, Type as T } from '../common.ts';
export { normalizeFileList } from './u.normalize.ts';

/**
 * Item: File List entry (object form).
 * Minimal common shape for a single file reference.
 */
export const FileListItemSchemaInternal = T.Object(
  {
    ref: T.String({ ...Pattern.Ref.Path({ description: 'File reference of this item.' }) }),
    name: T.Optional(T.String({ description: 'Display name for the file.' })),
    mime: T.Optional(T.String(Pattern.Type.Mime())),
  },
  {
    $id: 'trait.file-list.item',
    title: 'File List Item',
    additionalProperties: false,
  },
);

/** A single file reference, either a string path or an object `{ ref: string }`. */
const FileListEntrySchemaInternal = T.Union(
  [
    T.String({ ...Pattern.Ref.Path({ description: 'File reference.' }) }),
    FileListItemSchemaInternal,
  ],
  { description: 'File path or an object with a ref field.' },
);

/**
 * Properties: File List (canonical).
 * Canonical runtime shape is an array of items.
 */
export const FileListPropsSchemaInternal = T.Array(FileListEntrySchemaInternal, {
  $id: 'trait.file-list.props',
  title: 'File List Properties',
  description: 'Root is an array of file references (string or object form).',
});

/**
 * Authoring-time input: accept either a single entry (string | {ref,...})
 * OR the canonical array. Normalize to an array before use.
 */
export const FileListPropsInputSchemaInternal = T.Union(
  [FileListEntrySchemaInternal, FileListPropsSchemaInternal],
  {
    $id: 'trait.file-list.props.input',
    title: 'File List (Input)',
    description: 'Authoring convenience: single entry or array. Normalize to an array before use.',
  },
);

/**
 * Public widened exports (JSR-safe: explicit t.TSchema surface).
 */
export const FileListPropsInputSchema: t.TSchema = FileListPropsInputSchemaInternal;
export const FileListPropsSchema: t.TSchema = FileListPropsSchemaInternal;
export const FileListItemSchema: t.TSchema = FileListItemSchemaInternal;
