import type { t } from './common.ts';

export type StoreIndexEvents = t.Lifecycle & {
  readonly $: t.Observable<t.StoreIndexEvent>;
  readonly changed$: t.Observable<t.DocChanged<t.StoreIndexDoc>>;
  readonly added$: t.Observable<t.StoreIndexEventItem>;
  readonly removed$: t.Observable<t.StoreIndexEventItem>;
  readonly shared$: t.Observable<t.StoreIndexEventItem>;
  readonly renamed$: t.Observable<t.StoreIndexEventItem>;
};

/**
 * Events
 */
export type StoreIndexEvent = t.DocEvent<t.StoreIndexDoc> | StoreIndexChangeEvent;
export type StoreIndexChangeEvent =
  | StoreIndexAddedEvent
  | StoreIndexRemovedEvent
  | StoreIndexSharedEvent
  | StoreIndexRenamedEvent;

export type StoreIndexAddedEvent = {
  type: 'crdt:store:index/Added';
  payload: StoreIndexEventItem;
};
export type StoreIndexRemovedEvent = {
  type: 'crdt:store:index/Removed';
  payload: StoreIndexEventItem;
};
export type StoreIndexSharedEvent = {
  type: 'crdt:store:index/Shared';
  payload: StoreIndexEventItem;
};
export type StoreIndexRenamedEvent = {
  type: 'crdt:store:index/Renamed';
  payload: StoreIndexEventItem;
};

export type StoreIndexEventItem = {
  index: number;
  total: number;
  item: t.StoreIndexItem;
};
