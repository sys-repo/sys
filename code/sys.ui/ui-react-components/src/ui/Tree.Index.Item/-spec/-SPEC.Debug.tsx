import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Is, LocalStorage, Signal } from '../common.ts';

type P = t.IndexTreeItemProps;
type Storage = Pick<P, 'theme' | 'debug' | 'active' | 'enabled'> & { label?: string };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  enabled: D.enabled,
  active: D.active,
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
    active: s(snap.active),
    enabled: s(snap.enabled),
  };
  const p = props;
  const api = {
    props,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.label = Is.string(p.label.value) ? p.label.value : undefined;
      d.active = p.active.value;
      d.enabled = p.enabled.value;
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => {
          const v = p.label.value;
          const label = React.isValidElement(v) ? '<Component>' : v;
          return `label: ${label ?? `<undefined>`}`;
        }}
        onClick={() => {
          const style = css({ backgroundColor: Color.ruby() });
          const el = <div className={style.class}>Hello Div</div>;
          Signal.cycle(p.label, ['My-Label 👋', el, undefined]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `<undefined> (default: ${D.enabled})`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `active: ${p.active.value ?? `<undefined> (default: ${D.active})`}`}
        onClick={() => Signal.toggle(p.active)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
