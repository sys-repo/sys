/**
 * Isolated module with the { type: 'json' } import.
 */
import type { t } from './common.ts';
import file from './-bundle.json' with { type: 'json' };
export const json = file as t.FileMap;
