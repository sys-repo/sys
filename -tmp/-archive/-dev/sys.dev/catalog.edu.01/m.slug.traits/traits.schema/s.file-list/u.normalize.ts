import { type t, Is } from '../common.ts';

type Entry = t.FileListEntry;
type Item = t.FileListItem;

type F = t.SlugTraitsLib['Schema']['FileList'];

/**
 * Normalize `file-list` authoring input into canonical array-of-items.
 *
 * Rules:
 * - string → [{ref}]
 * - {ref,...} → [that object]
 * - array → map each entry with the above
 * - empty/undefined/null → []
 */
export const normalizeFileList: F['normalize'] = (input) => {
  if (input == null) return [];
  const toItem = (entry: Entry): Item => (Is.string(entry) ? { ref: entry } : entry);
  return isEntryArray(input) ? input.map(toItem) : [toItem(input)];
};

/**
 * Type guard that narrows the union to the readonly-array branch.
 */
const isEntryArray = (v: t.FileListPropsInput): v is readonly Entry[] => Array.isArray(v);
