import { type t, Obj, Schema, Signal } from './common.ts';
import { Meta } from './u.schema.ts';

type O = Record<string, unknown>;

/**
 * API:
 */
export const State = {
  updateMain,
  clearMain,
} as const;

/**
 * Clear the current Main view.
 */
export function clearMain(signals: t.SampleSignals) {
  signals.main.value = undefined;
}

/**
 * When the document has changed:
 *   1. Parse the meta-data to determine the main <View> to display.
 *   2. Find and parse the {props} for the <View> from within the document.
 */
function updateMain(signals: t.SampleSignals, getSchema: t.GetSchema) {
  const doc = signals.doc.value;
  const paths = Signal.toObject(signals.paths);
  const root = Obj.Path.get<{}>(doc?.current, paths.parsed);
  if (!root) {
    console.warn('No change, parsed document object could not be retrieved.');
    return;
  }

  /**
   * 1. Read meta from YAML:
   */
  const _meta = Obj.Path.get(root, paths.meta, {});
  const meta = Schema.try(() => Schema.Value.Parse(Meta, _meta));

  /**
   * 2. Read "/main" UI props and factory lookup-id from YAML:
   */
  const main = meta.value?.main;
  signals.main.value = undefined; // ← (reset).
  if (main?.props && main.component) {
    const p = Obj.Path.curry(main.props.split('/'));
    const component = main.component;
    const schema = getSchema(component);

    let props: O | undefined;
    if (schema) {
      const res = Schema.try(() => Schema.Value.Parse(schema, p.get(root)));
      props = res.value;
    }

    if (!props) props = p.get(root) as O;
    if (component && props) {
      signals.main.value = { component, props };
    }
  }
}
