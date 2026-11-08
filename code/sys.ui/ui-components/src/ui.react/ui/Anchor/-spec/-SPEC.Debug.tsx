import type React from 'react';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';
import { EXAMPLE_URL, Samples } from './-ui.Samples.tsx';

type P = t.Anchor.Props;
type Storage = Pick<P, 'theme' | 'href' | 'target' | 'download' | 'enabled'> & {
  children?: string;
  focusExamples: boolean;
};

const defaults: Storage = {
  theme: 'Dark',
  href: EXAMPLE_URL,
  enabled: D.enabled,
  target: D.target,
  download: D.download,
  children: EXAMPLE_URL,
  focusExamples: false,
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
    theme: s(snap.theme),
    href: s(snap.href),
    enabled: s(snap.enabled ?? D.enabled),
    target: s(snap.target),
    download: s(snap.download === true),
    children: s(snap.children),
    focusExamples: s(snap.focusExamples ?? defaults.focusExamples),
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
      d.enabled = p.enabled.value;
      d.target = p.target.value;
      d.download = p.download.value ? true : undefined;
      d.children = p.children.value;
      d.focusExamples = p.focusExamples.value;
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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{`${D.name}, A`}</div>

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Dev.Button
        block
        label={() => `href: ${v.href ?? '(none)'}`}
        onClick={() => {
          Signal.cycle<P['href']>(p.href, [undefined, EXAMPLE_URL, '/relative/path', '#hash']);
        }}
      />
      <Dev.Button
        block
        label={() => `enabled: ${p.enabled.value ?? `(undefined) ← default: ${D.enabled}`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Dev.Button
        block
        label={() => `children: ${p.children.value ?? '(none)'}`}
        onClick={() => {
          Signal.cycle<string | undefined>(p.children, [
            undefined,
            EXAMPLE_URL,
            'link label',
            'plain text (passthrough)',
          ]);
        }}
      />

      <hr />
      <Dev.Button
        block
        label={() => {
          return `target: ${p.target.value ?? `(undefined) ← default: ${D.target}`}`;
        }}
        onClick={() => {
          Signal.cycle<P['target']>(p.target, [undefined, '_blank', '_self', '_parent', '_top']);
        }}
      />
      <Dev.Button
        block
        label={() => `download: ${p.download.value} ← default: ${D.download}`}
        onClick={() => Signal.toggle(p.download)}
      />

      <hr />
      <Dev.Button
        block
        label={() => `focus examples: ${v.focusExamples}`}
        onClick={() => Signal.toggle(p.focusExamples)}
      />
      <div className={css(Styles.title, { marginTop: 22 }).class}>Sample States:</div>
      <Samples debug={debug} theme={theme.name} />

      <hr />
      <div className={Styles.title.class}>Debug</div>

      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
