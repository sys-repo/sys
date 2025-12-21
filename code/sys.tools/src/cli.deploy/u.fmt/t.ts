import type { t } from '../common.ts';

/**
 * Parsed contents of an endpoint YAML file.
 *
 * This is a minimal projection used by formatters:
 * - `provider` describes the remote publish target (if any)
 * - `mappings` describe how local directories are staged
 *
 * Validation and defaults are handled upstream.
 */
export type EndpointYamlFile = {
  readonly provider?: t.DeployTool.Config.Provider.All;
  readonly mappings?: readonly t.DeployTool.Staging.Mapping[];
};

/**
 * Pre-formatted provider display row.
 *
 * Intended for tabular CLI output where:
 * - `label` is the left-hand column key
 * - `value` is the human-readable, already-styled value
 */
export type ProviderFmt = {
  readonly label: string;
  readonly value: string;
};
