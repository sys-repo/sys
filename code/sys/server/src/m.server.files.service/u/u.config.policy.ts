import { Files, type t } from '../common.ts';

/**
 * Convert normalized service config into readonly Files policy.
 */
export function policyOf(
  config: t.FilesWebSocketService.Config,
): ReturnType<t.Files.Lib['Policy']['readonly']> {
  const watch = config.watch ? config.policy : false;
  return Files.Policy.readonly(config.policy, { watch });
}
