import { SampleSchema } from './-schemas/mod.ts';
import { type t, Obj, Schema, Signal } from './common.ts';

import { AssertError } from '@sinclair/typebox/value';
const attempt = <T>(fn: () => T | undefined) => {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    if (err instanceof AssertError) return { ok: false, error: err.error };
    console.warn('unhandled error:', err);
    return { ok: false };
  }
};

/**
 * When the document has changed:
 *   1. Parse the meta-data to determine the main <View> to display.
 *   2. Find and parse the {props} for the <View> from within the document.
 */
export function factoryUpdate(signals: t.SampleSignals) {
  const doc = signals.doc.value;
  const path = Signal.toObject(signals.path);
  const root = Obj.Path.get<{}>(doc?.current, path.parsed);
  if (!root) {
    console.warn('No change, parsed document object could not be retrieved.');
    return;
  }

  /**
   * 1. Read meta from YAML:
   */
  const _meta = Obj.Path.get(root, path.meta, {});
  const meta = attempt(() => Schema.Value.Parse(SampleSchema.Meta, _meta));

  /**
   * 2. Read /main UI props and factory lookup-id from YAML:
   */
  const main = meta.value?.main;
  signals.main.value = undefined;
  if (main?.props && main.component) {
    const p = Obj.Path.curry(main.props.split('/'));
    const video = attempt(() => Schema.Value.Parse(SampleSchema.Video, p.get(root)));
    if (video.value) {
      const component = main.component;
      const props = video.value;
      if (component && props) signals.main.value = { component, props };
    }
  }
}
