import type { DebugSignals } from './-SPEC.Debug.tsx';

import React from 'react';
import {
  type t,
  Button,
  CanvasPanel,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';

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

  sample('- panels: all', () => {
    const panels: t.CanvasPanelContentMap = {};
    CanvasPanel.all.forEach((panel) => (panels[panel] = { view: sampleElement(panel) }));
    return panels;
  });

  sample('- panels: partial', () => {
    return {
      purpose: '👋 hello string',
      uvp: { view: sampleElement('uvp') },
      revenue: { view: '🐷 revenue' },
    };
  });

  sample('(clear)', () => undefined);

  return <React.Fragment>{elements}</React.Fragment>;
}
