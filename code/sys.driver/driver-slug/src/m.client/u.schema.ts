export type WireSchemaValueError = {
  readonly path: string | readonly string[];
  readonly message: string;
};

export function formatSchemaReason(errors: readonly WireSchemaValueError[]): string {
  return errors
    .map((error) => {
      const path = pathToString(error.path);
      return path ? `${path}: ${error.message}` : error.message;
    })
    .join('; ');
}

const pathToString = (path: string | readonly string[]): string => {
  if (Array.isArray(path)) return path.join('/');
  if (typeof path === 'string') return path;
  return '';
};
