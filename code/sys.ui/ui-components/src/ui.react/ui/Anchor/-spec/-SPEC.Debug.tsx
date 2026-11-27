import type React from 'react';
import { Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';
import { EXAMPLE_LONG_LABEL, EXAMPLE_URL, Samples } from './-ui.Samples.tsx';

type P = t.Anchor.Props;
/** Old flags are read once, then removed when the union is persisted. */
type Stored = Partial<t.DebugValues> & { focusExamples?: boolean; linkExamples?: boolean };
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

const defaults: t.DebugValues = {
  theme: 'Dark',
  href: EXAMPLE_URL,
  enabled: D.enabled,
  mono: D.mono,
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
    mono: s(snap.mono ?? D.mono),
    truncate: s(snap.truncate ?? D.truncate),
    maxWidth: s(snap.maxWidth),
    target: s(snap.target),
    download: s(snap.download === true),
    children: s(snap.children),
    examples: s<t.DebugExamples>(examples),
    link: s(snap.link),
  };
  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.theme = p.theme.value;
        d.href = p.href.value;
        d.enabled = p.enabled.value;
        d.mono = p.mono.value;
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
    },
  });

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
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
  const view = v.examples;
  const navigation = view === 'none';
  const comparison = view === 'focus' || view === 'links';
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
      {navigation && (
        <Dev.Button
          block
          label={() => `href: ${v.href ?? '(none)'}`}
          onClick={() => {
            Signal.cycle<P['href']>(p.href, [undefined, EXAMPLE_URL, '/relative/path', '#hash']);
          }}
        />
      )}
      <Dev.Button
        block
        label={() => `enabled: ${p.enabled.value ?? `(undefined) ← default: ${D.enabled}`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      {!comparison && (
        <>
          <Dev.Button block label={() => `mono: ${v.mono}`} onClick={() => Signal.toggle(p.mono)} />
          <Dev.Button
            block
            label={() => `truncate: ${v.truncate}`}
            onClick={() => Signal.toggle(p.truncate)}
          />
        </>
      )}
      {navigation && (
        <>
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
        </>
      )}
      {navigation && (v.link
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
                if (link?.api === 'dev') {
                  const next = { default: 'web', web: 'none', none: 'default' } as const;
                  p.link.value = { ...link, resource: next[link.resource] };
                } else {
                  p.link.value = { ...link, resource: link?.resource ? undefined : 'web' };
                }
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
        ))}

      <hr />
      <section aria-label='Sample States'>
        <div className={Styles.title.class}>Sample States</div>
        <Samples debug={debug} theme={theme.name} />
      </section>
      <section aria-label='Comparisons'>
        <div className={css(Styles.title, { marginTop: 22 }).class}>Comparisons</div>
        {comparison && (
          <Dev.Button
            block
            label='Back to configured link'
            onClick={() => p.examples.value = 'none'}
          />
        )}
        <Dev.List
          theme={theme.name}
          columns={2}
          selected={comparison ? view : []}
          items={[
            {
              id: 'focus',
              label: 'Focus comparison',
              onActivate: ({ id }) => p.examples.value = id,
            },
            {
              id: 'links',
              label: 'Link comparison',
              onActivate: ({ id }) => p.examples.value = id,
            },
          ]}
        />
      </section>

      <hr className={css({ marginTop: 22 }).class} />
      <div className={Styles.title.class}>Debug</div>

      {!comparison && v.truncate && (
        <Dev.Button
          block
          label={() => `maxWidth: ${v.maxWidth ? `${v.maxWidth}px` : 'none'}`}
          onClick={() => {
            return Signal.cycle<t.DebugValues['maxWidth']>(p.maxWidth, [undefined, 120, 180, 320]);
          }}
        />
      )}
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
