type FieldInput<T extends string> = T | undefined | null;

/**
 * Format fields into a non-falsy list.
 */
export function fields<T extends string>(
  input: FieldInput<T>[] | undefined,
  defaults?: FieldInput<T>[],
): T[] {
  return (input ?? defaults ?? []).filter(Boolean) as T[];
}

/**
 * Helper for toggling a field in/out of a list.
 */
export function toggleField<T extends string>(
  currentFields: (T | undefined | null)[] = [],
  toggleField: T,
): T[] {
  const list = fields(currentFields);
  return list.includes(toggleField)
    ? list.filter((f) => f !== toggleField)
    : [...list, toggleField];
}
