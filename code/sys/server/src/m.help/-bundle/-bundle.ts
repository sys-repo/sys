import file from './-bundle.json' with { type: 'json' };
import type { FileMapJson } from '../common.ts';

export const json = file as FileMapJson;
