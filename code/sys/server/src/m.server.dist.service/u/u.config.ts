import { Fs, type t } from '../common.ts';
import { parseConfigText } from './u.config.parse.ts';
export { resolveConfigPath, resolveDir, snapshotServiceArgs } from './u.config.resolve.ts';

/** Load one normalized DistService configuration. */
export async function loadConfig(path: t.StringPath): Promise<t.DistService.Config> {
  const read = await Fs.readText(path);
  if (!read.ok) throw new Error(`DistService: failed to read config: ${Fs.trimCwd(path)}`);
  return parseConfigText(read.data ?? '', path);
}
