import type React from 'react';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';
import { EXAMPLE_LONG_LABEL, EXAMPLE_URL, Samples } from './-ui.Samples.tsx';

type P = t.Anchor.Props;
type Examples = 'none' | 'focus' | 'links';
export type DebugValues =
  & Pick<P, 'theme' | 'href' | 'target' | 'download' | 'enabled' | 'truncate'>
  & {
    children?: string;
    /** Harness width constraint, applied only while truncation is enabled. */
    maxWidth?: 120 | 180 | 320;
    examples: Examples;
    /** Undefined selects native Anchor.UI; an object selects Anchor.Link. */
    link?: Pick<t.Anchor.Link.Props, 'resource' | 'openIn'>;
  };
/** Old flags are read once, then removed when the union is persisted. */
type Stored = Partial<DebugValues> & { focusExamples?: boolean; linkExamples?: boolean };
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

const defaults: DebugValues = {
  theme: 'Dark',
  href: EXAMPLE_URL,
  enabled: D.enabled,
  truncate: D.truncate,
  maxWidth: undefined,
  target: D.target,
  download: D.download,
  children: EXAMPLE_URL,
  examples: 'none',
  link: undefined,
};

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Stored>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const examples = snap.examples ??
    (snap.linkExamples ? 'links' : snap.focusExamples ? 'focus' : defaults.examples);

  const props = {
    theme: s(snap.theme),
    href: s(snap.href),
    enabled: s(snap.enabled ?? D.enabled),
    truncate: s(snap.truncate ?? D.truncate),
    maxWidth: s(snap.maxWidth),
    target: s(snap.target),
    download: s(snap.download === true),
    children: s(snap.children),
    examples: s<Examples>(examples),
    link: s(snap.link),
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
      d.truncate = p.truncate.value;
      d.maxWidth = p.maxWidth.value;
      d.target = p.target.value;
      d.download = p.download.value ? true : undefined;
      d.children = p.children.value;
      d.examples = p.examples.value;
      d.link = p.link.value;
      delete d.focusExamples;
      delete d.linkExamples;
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
      <div className={Styles.title.class}>{v.link ? `${D.name}.Link` : `${D.name}, A`}</div>

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
        label={() => `truncate: ${v.truncate}`}
        onClick={() => Signal.toggle(p.truncate)}
      />
      <Dev.Button
        block
        label={() => `children: ${p.children.value ?? '(none)'}`}
        onClick={() => {
          Signal.cycle<string | undefined>(p.children, [
            undefined,
            EXAMPLE_URL,
            'link label',
            EXAMPLE_LONG_LABEL,
            'plain text (passthrough)',
          ]);
        }}
      />

      <hr />
      {v.link
        ? (
          <>
            <Dev.Button
              block
              label={() => `openIn: ${p.link.value?.openIn ?? D.link.openIn}`}
              onClick={() => {
                const link = p.link.value;
                p.link.value = { ...link, openIn: link?.openIn === 'new-tab' ? 'self' : 'new-tab' };
              }}
            />
            <Dev.Button
              block
              label={() => `resource: ${p.link.value?.resource ?? '(none)'}`}
              onClick={() => {
                const link = p.link.value;
                p.link.value = { ...link, resource: link?.resource ? undefined : 'web' };
              }}
            />
          </>
        )
        : (
          <>
            <Dev.Button
              block
              label={() => {
                return `target: ${p.target.value ?? `(undefined) ← default: ${D.target}`}`;
              }}
              onClick={() => {
                const targets = [undefined, '_blank', '_self', '_parent', '_top'];
                Signal.cycle<P['target']>(p.target, targets);
              }}
            />
            <Dev.Button
              block
              label={() => `download: ${p.download.value} ← default: ${D.download}`}
              onClick={() => Signal.toggle(p.download)}
            />
          </>
        )}

      <hr />
      <Dev.Button
        block
        label={() => `examples: ${v.examples}`}
        onClick={() => Signal.cycle<Examples>(p.examples, ['none', 'focus', 'links'])}
      />
      <div className={css(Styles.title, { marginTop: 22 }).class}>Sample States:</div>
      <Samples debug={debug} theme={theme.name} />

      <hr />
      <div className={Styles.title.class}>Debug</div>

      {v.truncate && (
        <Dev.Button
          block
          label={() => `maxWidth: ${v.maxWidth ? `${v.maxWidth}px` : 'none'}`}
          onClick={() => {
            return Signal.cycle<DebugValues['maxWidth']>(p.maxWidth, [undefined, 120, 180, 320]);
          }}
        />
      )}
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
