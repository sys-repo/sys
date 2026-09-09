import { D as FilesServerDefaults } from '../m.server.files/common.ts';

export * from '../m.server.files/common.ts';

export { Fs } from '@sys/fs';
export { Files } from '@sys/model/files/fs';
export { Schema } from '@sys/schema';
export { Yaml } from '@sys/yaml';

export const DEFAULTS = {
  path: FilesServerDefaults.path,
  hostname: '127.0.0.1',
} as const;

export const D = DEFAULTS;
