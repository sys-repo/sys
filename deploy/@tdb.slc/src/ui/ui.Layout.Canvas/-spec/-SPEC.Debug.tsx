import React from 'react';
import { CanvasCell } from '../../ui.Canvas.Project/mod.ts';
import {
  type t,
  Button,
  CanvasPanel,
  css,
  D,
  LocalStorage,
  ObjectView,
  Signal,
} from '../common.ts';

type P = t.CanvasLayoutProps;
type Storage = { borderRadius?: number } & Pick<P, 'theme' | 'debug'>;

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

  const defaults: Storage = {
    theme: 'Dark',
    debug: false,
    borderRadius: D.borderRadius,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    borderRadius: s(snap.borderRadius),
    panels: s<P['panels']>(),
  };
  const p = props;

  /**
   * Persist subsequent changes.
   */
  Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.theme = p.theme.value;
      d.borderRadius = p.borderRadius.value;
    });
  });

  const api = {
    props,
    listen() {
      Object.values(p)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

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
        label={() => `borderRadius: ${p.borderRadius.value ?? D.borderRadius}`}
        onClick={() => Signal.cycle(p.borderRadius, [0, 5, 15, 30])}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      <SampleButtons debug={debug} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function SampleButtons(props: { debug: DebugSignals }) {
  const { debug } = props;
  const p = debug.props;
  const styles = {
    emoji: css({ fontSize: 32, padding: 8, display: 'grid', placeItems: 'center' }),
  };

  const elements: t.ReactNode[] = [];
  const sampleElement = (panel: t.CanvasPanel) => {
    return <div className={styles.emoji.class}>{`🌳 ${panel}`}</div>;
  };

  const sample = (label: string, fn?: () => t.CanvasPanelContentMap | undefined) => {
    const btn = (
      <Button
        block
        key={elements.length}
        label={() => label}
        onClick={() => (p.panels.value = fn?.())}
      />
    );
    elements.push(btn);
  };

  sample('- panels: <all>', () => {
    const panels: t.CanvasPanelContentMap = {};
    CanvasPanel.all.forEach((panel) => (panels[panel] = { el: sampleElement(panel) }));
    return panels;
  });

  sample('- panels: <partial>', () => {
    return {
      purpose: { el: '👋 hello string' },
      uvp: { el: sampleElement('uvp') },
      revenue: { el: <CanvasCell theme={p.theme.value} /> },
    };
  });

  sample('(reset)', () => undefined);

  return <React.Fragment>{elements}</React.Fragment>;
}
