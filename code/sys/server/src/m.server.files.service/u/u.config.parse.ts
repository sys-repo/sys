import { Fs, type t, Yaml } from '../common.ts';
import {
  FilesWebSocketServiceConfigSchema,
  type FilesWebSocketServiceConfigDoc,
} from './u.config.schema.ts';

/**
 * Parse and normalize Files WebSocket service YAML config text.
 */
export function parseConfigText(
  text: string,
  path: t.StringPath,
  errorPrefix: string,
): t.FilesWebSocketService.Config {
  const parsed = Yaml.parse<unknown>(text);
  if (parsed.error) {
    const cause = parsed.error;
    throw new Error(`${errorPrefix}: invalid config YAML: ${Fs.trimCwd(path)}`, { cause });
  }

  const checked = FilesWebSocketServiceConfigSchema.validate(parsed.data);
  if (!checked.ok) {
    throw new Error(
      `${errorPrefix}: invalid config: ${schemaError(checked.errors)}: ${Fs.trimCwd(path)}`,
    );
  }

  return FilesWebSocketServiceConfigSchema.normalize(parsed.data as FilesWebSocketServiceConfigDoc);
}

/**
 * Helpers:
 */
function schemaError(
  errors: readonly { readonly path: string; readonly message: string }[],
): string {
  const first = errors[0];
  if (!first) return 'schema validation failed';
  const at = first.path ? ` at '${first.path}'` : '';
  return `${first.message}${at}`;
}
