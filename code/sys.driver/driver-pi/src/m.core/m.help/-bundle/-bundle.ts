import type { FileMap } from '@sys/fs/t';
import file from './-bundle.json' with { type: 'json' };

export const json = file as FileMap;
