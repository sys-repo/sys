import type React from 'react';
import { Spec } from '../../-test.ui.ts';
import { Admonition } from '../mod.ts';
import {
  Color,
  css,
  D,
  Dev,
  LocalStorage,
  Obj,
  Signal,
  STORAGE_KEY,
  Str,
  type t,
} from './common.ts';
import { type SampleId, samples } from './-samples.ts';

type P = t.Admonition.Props;
type Storage = Pick<P, 'debug' | 'theme'>;
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
};
const defaultSample: SampleId = 'titled';
const kinds: t.Admonition.Kind[] = ['note', 'tip', 'important', 'caution', 'warning'];
const about = Str.dedent(`
  A short aside for something worth knowing before you continue. The
  [O’Reilly Style Guide](https://oreillymedia.github.io/production-resources/styleguide/#headings)
  calls notes, tips, and warnings *admonitions*.
`);

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
    sample: s<SampleId>(defaultSample),
    kind: s<t.Admonition.Kind>(samples[defaultSample].kind),
    radius: s<t.Pixels>(D.radius),
    selectable: s<boolean>(D.selectable),
  };
  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.theme = p.theme.value;
        d.debug = p.debug.value;
      });
    },
  });

  function listen() {
    Signal.listen(props, true);
  }

  function select(id: SampleId) {
    p.sample.value = id;
    p.kind.value = samples[id].kind;
  }

  function reset() {
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.radius.value = D.radius;
    p.selectable.value = D.selectable;
    select(defaultSample);
  }

  return { props, listen, reset, select, attach };
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
      <Admonition.UI markdown={about} kind='tip' theme={theme.name} style={{ marginBottom: 8 }} />

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Dev.Button
        block
        label={() => `kind: ${Str.capitalize(v.kind)}`}
        onClick={() => Signal.cycle(p.kind, kinds)}
      />
      <Dev.Button
        block
        label={() => `radius: ${v.radius}px`}
        onClick={() => Signal.cycle(p.radius, [0, D.radius, 8, 12])}
      />

      <Dev.Button
        block
        label={() => `selectable: ${v.selectable}`}
        onClick={() => Signal.toggle(p.selectable)}
      />

      <hr />
      <div className={Styles.title.class}>Samples</div>
      <Dev.List
        theme={theme.name}
        columns={1}
        selected={v.sample}
        items={Obj.keys(samples).map((id) => ({
          id,
          label: `${samples[id].label} (${Str.capitalize(samples[id].kind)})`,
          onActivate: () => debug.select(id),
        }))}
      />

      <hr />
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
