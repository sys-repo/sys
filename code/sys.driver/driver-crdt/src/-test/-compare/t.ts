export type * from '../t.ts';
export type { Cmd } from '@sys/event/t';
import type { t } from './common.ts';

type Empty = Record<string, never>;

/** Test-only observation envelope; metadata is native and is not a value patch. */
export type Snapshot = {
  value: t.FixtureNote;
  basis: string;
  metadata: unknown;
  selection: number[];
};
export type Frame = {
  readonly snapshot: Snapshot;
  readonly binary: Uint8Array;
  readonly writer: string;
  readonly revision: number;
};

/** A bounded fixture author, not a general CRDT operation language or public editor API. */
export type Editor = {
  title(value: string): void;
  label(index: number, value: string): void;
  insertItem(index: number, item: t.FixtureNote['items'][number]): void;
  insertText(index: number, value: string): void;
  deleteText(index: number, count: number): void;
  format(start: number, end: number, bold: boolean): void;
};

/** Driver-private native state; no mutable native document escapes this boundary. */
export type Native = {
  readonly writer: string;
  capture(): Snapshot;
  save(): Uint8Array;
  apply(binary: Uint8Array): void;
  author(fn: (edit: Editor) => void): void;
  readonly change?: (fn: t.ImmutableMutator<t.FixtureNote>) => void;
  readonly headsOnly?: () => void;
  dispose(): void | Promise<void>;
};
export type NativeFactory = (seed: Uint8Array) => Native;
export type Mode = 'async-owner' | 'native-replica';
export type Specimen = {
  name: 'Automerge' | 'Yjs';
  worker: URL;
  replica: NativeFactory;
  formatted: unknown;
  draftRef: boolean;
  rollback: boolean;
  composeDraft?: (draft: t.FixtureNote, title: string) => void;
};

/** Installed owner actions, deliberately specific to the test document. */
export type Write =
  | {
    readonly kind: 'label-index';
    readonly basis: string;
    readonly index: number;
    readonly value: string;
  }
  | { readonly kind: 'label-id'; readonly id: string; readonly value: string }
  | { readonly kind: 'compose'; readonly title: string; readonly bold: boolean }
  | { readonly kind: 'format'; readonly bold: boolean }
  | { readonly kind: 'delete-text' };
export type Receipt = {
  readonly accepted: boolean;
  readonly reason?: 'stale-basis' | 'missing-item' | 'policy';
  readonly frame: Frame;
  readonly callback: 'owner' | 'caller';
};
export type Payload = {
  read: Empty;
  observe: Empty;
  write: Write;
  submit: { readonly binary: Uint8Array };
  peer: { readonly binary: Uint8Array };
  hold: Empty;
  arrived: Empty;
  release: Empty;
  admission: { readonly allow: boolean };
  shutdown: Empty;
};
export type Names = keyof Payload;
export type Results = {
  read: Frame;
  observe: void;
  write: Receipt;
  submit: Receipt;
  peer: Frame;
  hold: void;
  arrived: void;
  release: void;
  admission: void;
  shutdown: void;
};
export type Events = { [K in Names]: K extends 'observe' ? Frame : never };
export type WireClient = t.Cmd.Client.Handle<Names, Payload, Results, Events>;

/** Value patches plus explicit, coherently captured native context. */
export type Change = t.ImmutableChange<t.FixtureNote, t.Rfc6902PatchOperation> & {
  readonly native: { readonly before: Snapshot; readonly after: Snapshot };
};
export type ViewEvents = t.ImmutableEvents<t.FixtureNote, t.Rfc6902PatchOperation, Change>;
export type View = t.ImmutableRefReadonly<t.FixtureNote, t.Rfc6902PatchOperation, ViewEvents>;
export type Ref = t.ImmutableRef<t.FixtureNote, t.Rfc6902PatchOperation, ViewEvents>;
