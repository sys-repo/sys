import type React from 'react';
import { Spec } from '../../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Signal, STORAGE_KEY, type t } from './common.ts';
import { Sample, type SampleKind } from './-u.sample.ts';

type P = t.DevHelpMarkdown.Props;
type Storage = Pick<P, 'debug' | 'theme'> & { sample?: SampleKind };

const defaults = {
  debug: false,
  theme: 'Dark',
  sample: Sample.defaultKind,
} satisfies Storage;
const initialLinksTabbable = true; // Ephemeral specimen input.

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    linksTabbable: s<boolean>(initialLinksTabbable),
    sample: s(Sample.resolveKind(snap.sample)),
  };
  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.theme = p.theme.value;
        d.debug = p.debug.value;
        d.sample = p.sample.value;
      });
    },
  });

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.linksTabbable.value = initialLinksTabbable;
    p.sample.value = defaults.sample;
  }

  return { props, listen, reset, attach };
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
      <div className={Styles.title.class}>{D.name}</div>

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Dev.Button
        block
        label={() => `linksTabbable: ${v.linksTabbable}`}
        onClick={() => Signal.toggle(p.linksTabbable)}
      />

      <hr />
      <div className={Styles.title.class}>Samples</div>
      <Dev.List
        theme={theme.name}
        columns={1}
        selected={v.sample}
        items={Sample.kinds.map((id) => ({
          id,
          label: Sample.get(id).label,
          onActivate: () => p.sample.value = id,
        }))}
      />

      <hr />
      <div className={Styles.title.class}>Debug:</div>
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label='(reset)' onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
