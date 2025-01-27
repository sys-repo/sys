import { pkg } from '../pkg.ts';
const ns = pkg.name;

/**
 * Type display names.
 */
export const Typenames = {
  RepoList: {
    List: 'RepoList.List',
    Item: 'RepoList.Item',
  },
} as const;

/**
 * Symbols library.
 */
export const Symbols = {
  kind: Symbol(`${ns}.kind`),
  Lens: Symbol(`${ns}.Lens`),
  Namespace: Symbol(`${ns}.Namespace`),
  Doc: Symbol(`${ns}.Doc`),
  Store: Symbol(`${ns}.Store`),
  StoreIndex: Symbol(`${ns}.StoreIndex`),
  WebStore: Symbol(`${ns}.WebStore`),
  FsStore: Symbol(`${ns}.FsStore`),
} as const;
