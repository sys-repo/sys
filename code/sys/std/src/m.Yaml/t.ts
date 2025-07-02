import type { t } from './common.ts';

/**
 * Helpers for working with YAML.
 */
export type YamlLib = {
  /**
   * Safely parse YAML.
   */
  parse<T>(input?: string): YamlParseResponse<T>;
};

/** Response from the `Yaml.parse` method. */
export type YamlParseResponse<T> = {
  data?: T;
  error?: t.StdError;
};
