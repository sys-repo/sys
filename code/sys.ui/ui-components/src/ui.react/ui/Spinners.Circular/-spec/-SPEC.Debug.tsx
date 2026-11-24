import { Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Signal, type t } from './common.ts';

type Props = t.CircularSpinner.Props;
type Storage = Pick<Props, 'theme'>;
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

const defaults: Storage = {};
const sizes = [D.micro.maxSize, 16, 20, D.size, 32, 64] as const;

/** Persist the selected theme while the specimen is attached. */
export function createDebugSignals() {
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const props = {
    theme: Signal.create<Props['theme']>(snap.theme),
    size: Signal.create<number>(D.size),
  };
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.theme = props.theme.value;
      });
    },
  });

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.batch(() => {
      props.theme.value = defaults.theme;
      props.size.value = D.size;
    });
  }

  return { props, listen, reset, attach };
}

const title = css({ fontWeight: 'bold', marginBottom: 4 });

/** Inspect the spinner props and preview the size samples. */
export const Debug: t.FC<DebugProps> = (props) => {
  const { debug, style } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  const theme = Color.theme();
  return (
    <div className={css({ color: theme.fg }, style).class}>
      <div className={title.class}>{D.name}</div>
      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<Props['theme']>(p.theme, [undefined, 'Light', 'Dark'])}
      />
      <hr />
      <div className={title.class}>Sample States</div>
      <Dev.List
        theme={theme.name}
        selected={String(v.size)}
        items={sizes.map((size) => ({
          id: String(size),
          label: `${size}px${size === D.size ? ' (default)' : ''}`,
          onActivate: () => p.size.value = size,
        }))}
      />
      <hr />
      <Dev.Button block label={() => '(reset)'} onClick={debug.reset} />
      <Dev.ObjectView name='props' data={v} expand={1} style={{ marginTop: 20 }} />
    </div>
  );
};
