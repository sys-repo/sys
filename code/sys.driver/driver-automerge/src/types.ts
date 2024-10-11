/**
 * @module
 * Types: System Driver for Automerge
 */
export type * from './crdt/Doc.Lens/t.ts';
export type * from './crdt/Doc.Namespace/t.ts';
export type * from './crdt/Doc/t.ts';
export type * from './crdt/Store.Index/t.ts';
export type * from './crdt/Store/t.ts';

export type * from './crdt.web/Store.Web.Index/t.ts';
export type * from './crdt.web/Store.Web.IndexDb/t.ts';
export type * from './crdt.web/Store.Web/t.ts';

/**
 * Automerge JS object extensions.
 */
export interface AutomergeArray<T> extends Array<T> {
  deleteAt(index: number, total?: number): void;
  insertAt(index: number, ...items: T[]): void;
}
