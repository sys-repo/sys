import React from 'react';
import { type t, Color, css, D, LocalStorage, Obj, Signal } from './common.ts';
import { Button, ObjectView } from '../../u.ts';

type P = t.Anchor.Props;
type Storage = Pick<P, 'theme' | 'href' | 'target' | 'download'>;
const defaults: Storage = {
  theme: 'Dark',
  href: 'https://example.com',
  target: D.target,
  download: D.download,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    theme: s(snap.theme),
    href: s(snap.href),
    target: s(snap.target),
    download: s(snap.download === true),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.href = p.href.value;
      d.target = p.target.value;
      d.download = p.download.value ? true : undefined;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
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
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `href: ${v.href ?? '(none)'}`}
        onClick={() => {
          Signal.cycle<P['href']>(p.href, [
            undefined,
            'https://example.com',
            '/relative/path',
            '#hash',
          ]);
        }}
      />

      <hr />
      <Button
        block
        label={() => {
          return `target: ${p.target.value ?? `(undefined) ← default: ${D.target}`}`;
        }}
        onClick={() => {
          Signal.cycle<P['target']>(p.target, [undefined, '_blank', '_self', '_parent', '_top']);
        }}
      />
      <Button
        block
        label={() => `download: ${p.download.value} ← default: ${D.download}`}
        onClick={() => Signal.toggle(p.download)}
      />

      <hr />
      <div className={Styles.title.class}>{'Debug'}</div>

      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
