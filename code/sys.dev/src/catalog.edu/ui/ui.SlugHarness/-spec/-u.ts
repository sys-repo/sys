import { type t, D } from '../common.ts';

export const PATH = {
  dev: ['.dev', D.displayName] satisfies t.ObjectPath,
  main: ['view:main'],
  selectedPath: ['view:tree:path'],
};
