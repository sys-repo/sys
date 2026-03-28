import { type t } from './common.ts';

/**
 * Normalize shared deploy execution settings.
 */
export const DeployConfig = {
  normalize(input: t.DenoDeploy.DeployConfig): t.DenoDeploy.DeployConfig {
    return {
      ...input,
      app: input.app.trim(),
      ...(DeployConfig.optional(input.org) ? { org: DeployConfig.optional(input.org) } : {}),
      ...(DeployConfig.optional(input.token) ? { token: DeployConfig.optional(input.token) } : {}),
    };
  },

  optional(value?: string) {
    const text = value?.trim();
    return text && text.length > 0 ? text : undefined;
  },
} as const;
