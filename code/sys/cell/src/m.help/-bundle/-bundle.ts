import file from './-bundle.json' with { type: 'json' };
import type { t } from '../common.ts';

export const json = file as t.FileMap;
