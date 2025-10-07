import YAML from 'yaml';
import type { t } from './common.ts';

/**
 * Parse YAML and return the first error found.
 * Throws if the source contains no errors.
 */
export function makeYamlError(src: string): t.YamlError {
  const doc = YAML.parseDocument(src);
  if (doc.errors.length === 0)
    throw new Error('makeYamlError: expected a YAML error but none were produced');
  else return doc.errors[0] as t.YamlError;
}
