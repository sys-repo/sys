type SchemaError = {
  readonly path: string | readonly string[];
  readonly message: string;
};

export function formatSchemaReason(errors: readonly SchemaError[]): string {
  return errors
    .map((error) => {
      const path = Array.isArray(error.path) ? error.path.join('/') : error.path;
      return path ? `${path}: ${error.message}` : error.message;
    })
    .join('; ');
}
