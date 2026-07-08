import { Pkg, pkg, type t } from '../common.ts';
import { D as InfoPanelD } from '../ui.InfoPanel/common.ts';

export * from '../common.ts';

type Field = t.Files.InfoPanel.Field;

/**
 * Constants:
 */
const name = 'Files.InfoPanel.Config';
const fields: readonly Field[] = InfoPanelD.fieldOrder;
const fieldLabels: Partial<Record<Field, string>> = {
  'title.status': 'status',
  'title.status.label': 'status:label',
  transport: 'network (connection)',
};
const reorder = true;
const animation = true;
const layout = {
  kind: 'spaced',
  columnGap: 10,
  rowGap: 4,
} satisfies t.KeyValue.LayoutSpaced;
const defaults: t.Files.InfoPanel.Config.Defaults = {
  fields,
  reorder,
  animation,
};

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  fields,
  fieldLabels,
  reorder,
  animation,
  layout,
} as const;
export const DEFAULTS = defaults;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
