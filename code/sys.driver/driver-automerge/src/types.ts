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
 * TODO 🐷 Automerge [migrate]
 */

//
// export type * from './crdt.sync/TextboxSync/t.ts';
//
// export type * from './ui/ui.Buttons/t.ts';
// export type * from './ui/ui.Cmd.Bar/t.ts';
// export type * from './ui/ui.DocUri/t.ts';
// export type * from './ui/ui.Info.History.Commit/t.ts';
// export type * from './ui/ui.Info.History.Grid/t.ts';
// export type * from './ui/ui.Info/t.ts';
// export type * from './ui/ui.Nav.Paging/t.ts';
// export type * from './ui/ui.RepoList.Model/t.ts';
// export type * from './ui/ui.RepoList.Virtual/t.ts';
// export type * from './ui/ui.RepoList/t.ts';
// export type * from './ui/ui.use/t.ts';

/**
 * Automerge JS object extensions.
 */
export interface AutomergeArray<T> extends Array<T> {
  deleteAt(index: number, total?: number): void;
  insertAt(index: number, ...items: T[]): void;
}
