import type { t } from './common.ts';

/** Tools for working with selection paths in YAML. */
export type Lib = Readonly<{
  /** Create a new YAML cursor path observer. */
  observe(args: { editor: t.Monaco.Editor; bus$?: t.EditorBus.Subject }, until?: t.UntilInput): Observer;
}>;

/** Live observer of the object path at the user's caret in a YAML document. */
export type Observer = t.Lifecycle & {
  readonly $: t.Observable<t.EditorEvent.Yaml.Cursor>;
  readonly current: t.EditorEvent.Yaml.Cursor;
};
