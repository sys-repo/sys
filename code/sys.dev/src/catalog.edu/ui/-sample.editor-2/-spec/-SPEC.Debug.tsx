import React from 'react';
import { createRepo, DevUrl } from '../../-test.ui.ts';
import { type t, Color, css, D, Icons, LocalStorage, Obj, Signal } from '../common.ts';

import { Button, ObjectView } from '../common.ts';

type P = t.Sample2Props;
type Storage = Pick<P, 'debug' | 'theme' | 'wordWrap'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  wordWrap: false,
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
    wordWrap: s(snap.wordWrap),
  };
  const p = props;
  const api = {
    props,
    url: DevUrl.make(window),
    repo: createRepo(),
    reset,
    listen,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.wordWrap = p.wordWrap.value;
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
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{'Slug'}</div>
      </div>

      <Button
        block
        label={() => (
          <div className={styles.vcenter.class}>
            <Icons.ClosePanel.Right />
            {`debug=false (via query-string → reload)`}
          </div>
        )}
        onClick={() => {
          debug.url.debug = false;
          window.location.reload();
        }}
      />

      <hr />

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `wordWrap: ${p.wordWrap.value}`}
        onClick={() => Signal.toggle(p.wordWrap)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
