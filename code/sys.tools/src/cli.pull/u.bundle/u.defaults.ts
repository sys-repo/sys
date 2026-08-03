import type { t } from '../common.ts';

export function resolveBundleForPull(
  bundle: t.PullTool.ConfigYaml.Bundle,
  defaults?: t.PullTool.ConfigYaml.Defaults,
): t.PullTool.ConfigYaml.Bundle {
  if (bundle.kind !== 'http') return bundle;
  const clear = bundle.local.clear ?? defaults?.http?.clear ?? false;
  return {
    ...bundle,
    local: { ...bundle.local, clear },
  };
}
