import { Fs, type t } from '../common.ts';
import { parseConfigText } from './u.config.parse.ts';
export { policyOf } from './u.config.policy.ts';
export { resolveConfigPath, resolveRoot } from './u.config.resolve.ts';

const ERROR_PREFIX = 'FilesWebSocketService';

/**
 * Load and normalize a Files WebSocket service YAML config.
 */
export async function loadConfig(
  path: t.StringPath,
  errorPrefix = ERROR_PREFIX,
): Promise<t.FilesWebSocketService.Config> {
  const read = await Fs.readText(path);
  if (!read.ok) {
    throw new Error(`${errorPrefix}: failed to read config: ${Fs.trimCwd(path)}`);
  }
  return parseConfigText(read.data ?? '', path, errorPrefix);
}
