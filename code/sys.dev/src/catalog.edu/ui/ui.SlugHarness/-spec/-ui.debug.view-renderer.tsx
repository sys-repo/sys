import { KeyValue } from '@sys/ui-react-components';
import React from 'react';

import { type t, Button, Color, Crdt, css, Lens, Signal } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type O = Record<string, unknown>;

export type SlugViewsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SlugViews: React.FC<SlugViewsProps> = (props) => {
  const { debug } = props;
  const buttonsActive = false; // NB: not-clickable → control from YAML editor.

  const registry = debug.registry;
  const s = debug.signals;
  const p = debug.props;
  const v = Signal.toObject(p);
  const doc = s.doc.value;

  const lens = doc ? Lens.at<O>(doc, v.docPath, v.slugPath) : undefined;
  const ui = lens?.at<t.ViewRendererProps>(['data', 'ui']);
  const isCurrent = (id: t.StringId) => p.mainView.value === id;

  /**
   * Handlers:
   */
  function handleClick(item?: t.SlugViewRegistryItem) {
    console.info('⚡️ clicked/item:', item);
  }

  /**
   * Effects:
   */
  Signal.useRedrawEffect(debug.listen);
  Crdt.UI.useRev(doc);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const elButtons = registry.list().map((item, i) => {
    const id = item.id;
    return (
      <Button
        block
        key={`${i}.${id}`}
        active={buttonsActive}
        label={() => `main view: ${id} ${isCurrent(id) ? '🌳' : ''}`}
        onClick={() => handleClick(item)}
      />
    );
  });

  let view = ui?.get()?.view ?? '';

  const elInfo = (
    <KeyValue.View
      theme={theme.name}
      style={{ Margin: [40, 20] }}
      items={[
        { kind: 'title', v: 'View Renderer' },
        { k: 'view (key)', v: view },
        { k: 'cropmarks', v: wrangle.cropmarks(ui?.get()?.cropmarks?.size) },
      ]}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elButtons}
      <Button
        block
        active={buttonsActive}
        label={() => `(none)`}
        onClick={() => handleClick(undefined)}
      />
      {elInfo}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  cropmarks(input?: t.CropmarksSize): string {
    if (!input) return '-';
    const { mode } = input;

    switch (mode) {
      case 'center': {
        const { width, height } = input;
        if (!width && !height) return 'center';
        return `center (${width ?? 'auto'}x${height ?? 'auto'})`;
      }

      case 'fill': {
        const { x, y, margin } = input;
        const axes = x && y ? 'x,y' : x ? 'x' : y ? 'y' : '';
        const parts = [axes, margin ? `margin:${margin}` : undefined].filter(Boolean);
        return `fill${parts.length ? ` (${parts.join(', ')})` : ''}`;
      }

      case 'percent': {
        const { width, height, maxWidth, maxHeight, margin, aspectRatio } = input;
        const dims = [(width ?? height) ? `${width ?? ''}${height ? `×${height}` : ''}%` : '']
          .filter(Boolean)
          .join('');
        const parts = [
          dims,
          maxWidth ? `max-width:${maxWidth}` : undefined,
          maxHeight ? `max-height:${maxHeight}` : undefined,
          margin ? `margin:${margin}` : undefined,
          aspectRatio ? `ratio:${aspectRatio}` : undefined,
        ].filter(Boolean);
        return `percent${parts.length ? ` (${parts.join(', ')})` : ''}`;
      }

      default:
        return '-';
    }
  },
} as const;
