import file from './-bundle.json' with { type: 'json' };
import type { FileMap } from '@sys/fs/t';

export const json = file as FileMap;
