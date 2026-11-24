import { Dev, type t } from './common.ts';

const views = [
  ['panel', 'Panel'],
  ['actions', 'Actions'],
  ['status', 'Status'],
  ['context', 'Context'],
] as const satisfies readonly (readonly [t.Passkey.View, string])[];

type Props = {
  view: t.Passkey.View;
  theme: t.CommonTheme;
  onSelect: (view: t.Passkey.View) => void;
};

/** Shared DevHarness control; the caller owns the selected view. */
export const ViewPicker: t.FC<Props> = ({ view, theme, onSelect }) => {
  const items = views.map(([id, label]) => ({ id, label, onActivate: () => onSelect(id) }));
  return <Dev.List theme={theme} selected={view} items={items} />;
};
