import type React from 'react';
import { Color, css, D, Dev, LocalStorage, Signal, STORAGE_KEY, type t } from './common.ts';
import { SpecLink } from '../../-ui.Links.tsx';
import { Fixtures } from './-u.fixtures.ts';
import { Intent } from './-ui.Intent.tsx';

type P = t.Passkey.Props;
type Storage = Pick<P, 'debug' | 'theme'>;
const defaults: Storage = {
  debug: D.debug,
  theme: 'Dark',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 * Theme/debug persist; state presets, callback toggle, and captured intent remain ephemeral.
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    fixture: s<t.PasskeyFixture>(Fixtures[0]),
    callbacksEnabled: s(true),
    intent: s<t.PasskeyIntent | undefined>(undefined),
  };
  const p = props;

  const actions = {
    onCreateAccount: () => capture('create-account'),
    onSignIn: () => capture('sign-in'),
    onAddPasskey: () => capture('add-passkey'),
    onSignOut: () => capture('sign-out'),
  } satisfies Pick<t.Passkey.Props, 'onCreateAccount' | 'onSignIn' | 'onAddPasskey' | 'onSignOut'>;

  function listen() {
    Signal.listen(props, true);
  }

  function capture(action: t.Passkey.Action) {
    p.intent.value = { action, count: (p.intent.value?.count ?? 0) + 1 };
  }

  function select(fixture: t.PasskeyFixture) {
    p.fixture.value = fixture;
    p.intent.value = undefined;
  }

  function reset() {
    p.theme.value = defaults.theme;
    p.debug.value = defaults.debug;
    p.callbacksEnabled.value = true;
    select(Fixtures[0]);
  }

  const dispose = Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
    });
  });

  const api = {
    props,
    listen,
    reset,
    actions,
    select,
    dispose,
  };
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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>(view:pure)</div>
      </div>
      <div>
        <SpecLink to='sample' />
      </div>
      <hr />
      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={Styles.title.class}>
        <div>Property States</div>
        <div>(simulated)</div>
      </div>
      {Fixtures.map((fixture) => (
        <Dev.Button
          key={fixture.id}
          block
          label={() => `${fixture.label}${fixture.id === v.fixture.id ? ' 🌳' : ''}`}
          onClick={() => debug.select(fixture)}
        />
      ))}
      <hr />
      <div className={Styles.title.class}>Action callbacks</div>
      <Dev.Button
        block
        label={() => `callbacks: ${v.callbacksEnabled ? 'record intent only' : 'not supplied'}`}
        onClick={() => Signal.toggle(p.callbacksEnabled)}
      />
      <Intent intent={v.intent} />

      <hr />
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
