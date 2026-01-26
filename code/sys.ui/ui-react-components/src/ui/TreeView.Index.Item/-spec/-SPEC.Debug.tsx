import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Icons, Is, LocalStorage, Obj, Signal, Str } from '../common.ts';

type P = t.IndexTreeViewItemProps;
type Storage = Pick<P, 'theme' | 'debug' | 'active' | 'enabled' | 'selected'> & {
  label?: string;
  description?: string;
  chevron?: boolean;
  paddingPreset?: PaddingPreset;
};

export const PADDING = {
  spacious: [20, 12, 20, 20] satisfies t.CssPaddingInput,
  default: D.padding,
  compact: [10, 6, 8, 10] satisfies t.CssPaddingInput,
  tight: [5, 5, 5, 10] satisfies t.CssPaddingInput,
} as const;
type PaddingPreset = keyof typeof PADDING;

const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  label: undefined,
  description: undefined,
  enabled: D.enabled,
  active: D.active,
  chevron: D.chevron,
  selected: D.selected,
  paddingPreset: 'default',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    label: s(snap.label),
    description: s(snap.description),
    chevron: s(snap.chevron),
    active: s(snap.active),
    enabled: s(snap.enabled),
    selected: s(snap.selected),
    paddingPreset: s(snap.paddingPreset),
  };
  const p = props;
  const api = {
    props,
    listen,
    get padding() {
      const v = p.paddingPreset.value;
      return v ? PADDING[v] : undefined;
    },
  };

  function listen() {
    Signal.listen(props, true);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.active = p.active.value;
      d.enabled = p.enabled.value;
      d.label = Is.string(p.label.value) ? p.label.value : undefined;
      d.description = Is.string(p.description.value) ? p.description.value : undefined;
      d.paddingPreset = p.paddingPreset.value;
      d.chevron = Is.bool(p.chevron.value) ? p.chevron.value : undefined;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.label.value;
          const label = React.isValidElement(v) ? 'custom <Component>' : v;
          return `label: ${label ?? `(undefined)`}`;
        }}
        onClick={() => {
          const style = css({ backgroundColor: Color.ruby() });
          const el = <div className={style.class}>Hello Div</div>;
          Signal.cycle(p.label, ['My-Label 👋', el, Str.Lorem.words(15), undefined]);
        }}
      />
      <Button
        block
        label={() => {
          const v = p.description.value;
          const description = React.isValidElement(v) ? 'custom <Component>' : v;
          return `description: ${description ?? `(undefined)`}`;
        }}
        onClick={() => {
          const style = css({ backgroundColor: Color.ruby() });
          const el = <div className={style.class}>Hello Div</div>;
          Signal.cycle(p.description, ['My-Description 👋', el, Str.Lorem.words(15), undefined]);
        }}
      />
      <Button
        block
        label={() => {
          const v = p.chevron.value;
          const label = React.isValidElement(v) ? 'custom <Icon>' : v;
          return `chevron: ${label ?? `(undefined)`}`;
        }}
        onClick={() => {
          const style = css({ backgroundColor: Color.ruby() });
          const el = <Icons.Face style={style} />;
          Signal.cycle(p.chevron, [false, true, el, undefined]);
        }}
      />
      <Button
        block
        label={() => {
          const preset = (p.paddingPreset.value ?? 'default') as PaddingPreset;
          const values = PADDING[preset];
          return `padding: ${preset} [${values.join(', ')}]`;
        }}
        onClick={() => Signal.cycle(p.paddingPreset, Object.keys(PADDING))}
      />

      <hr />
      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `(undefined) (default: ${D.enabled})`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `active: ${p.active.value ?? `(undefined) (default: ${D.active})`}`}
        onClick={() => Signal.toggle(p.active)}
      />
      <Button
        block
        label={() => `selected: ${p.selected.value ?? `(undefined) (default: ${D.selected})`}`}
        onClick={() => Signal.toggle(p.selected)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)))}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
