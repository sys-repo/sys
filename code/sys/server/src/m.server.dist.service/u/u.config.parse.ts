import { Fs, type t, Yaml } from '../common.ts';
import { type DistServiceConfigDoc, DistServiceConfigSchema } from './u.config.schema.ts';

/** Parse and normalize one strict DistService YAML document. */
export function parseConfigText(text: string, path: t.StringPath): t.DistService.Config {
  const parsed = Yaml.parse<unknown>(text);
  if (parsed.error) {
    throw new Error(`DistService: invalid config YAML: ${Fs.trimCwd(path)}`);
  }

  const checked = DistServiceConfigSchema.validate(parsed.data);
  if (!checked.ok) {
    throw new Error(`DistService: invalid config: ${schemaError(checked.errors)}`);
  }

  return DistServiceConfigSchema.normalize(parsed.data as DistServiceConfigDoc);
}

function schemaError(
  errors: readonly { readonly path: string; readonly message: string }[],
): string {
  const first = errors[0];
  if (!first) return 'schema validation failed';
  const at = first.path ? ` at '${first.path}'` : '';
  return `${first.message}${at}`;
}
