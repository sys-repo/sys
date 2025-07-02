/**
 * Module types.
 * @module
 */
export type * as A from '@automerge/automerge/next';
export type { Crdt } from './t.namespace.ts';

export type * from './-platforms/-browser/t.ts';
export type * from './-platforms/-fs/t.ts';

export type * from './m.Crdt.ref/t.ts';
export type * from './m.Crdt.repo/t.ts';
export type * from './m.Crdt/t.ts';
export type * from './m.Server/t.ts';

export type * from './ui.Crdt/t.ts';
export type * from './ui/ui.Card/t.ts';
export type * from './ui/ui.DocumentId/t.ts';
export type * from './ui/ui.Repo/t.ts';
export type * from './ui/ui.TextEditor/t.ts';
export type * from './ui/ui.TextPanel/t.ts';
