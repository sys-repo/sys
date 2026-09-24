export type * from '@sys/types';

/** Value-only fixture schema; native annotations deliberately live outside this shape. */
export type FixtureNote = {
  title: string;
  items: { id: string; label: string }[];
  text: string;
};
