import { Str, pkg, R, Value, type t } from '../common.ts';
export * from '../common.ts';

const formatter: t.ObjectViewFormatter = (data) => {
  data = R.clone(data);

  // NB: Ensure large binary objects don't (💥) the component on render.
  Value.Obj.walk(data, (e) => {
    if (e.value instanceof Uint8Array) {
      const bytes = Str.bytes(e.value.byteLength);
      const text = `<Uint8Array>[${bytes}]`;
      (e.parent as any)[e.key] = text;
    }
  });

  return data;
};

/**
 * Constants
 */
const theme: t.CommonTheme = 'Light';
const name = pkg.name;
const displayName = `${name}:ObjectView`;

export const DEFAULTS = {
  name,
  displayName,
  theme,
  formatter,
  font: { size: 12 },
  showRootSummary: true,
  showNonenumerable: false,
} as const;
