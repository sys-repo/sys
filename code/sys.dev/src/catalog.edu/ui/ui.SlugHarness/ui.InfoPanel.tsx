import React from 'react';
import { type t, Color, KeyValue, Lens } from './common.ts';

type O = Record<string, unknown>;
type P = t.SlugHarnessProps;

export type InfoPanelProps = {
  registry?: t.SlugViewRegistryReadonly;
  doc?: t.Crdt.Ref;
  path?: P['path'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { debug = false, registry, path = {}, doc } = props;
  if (!registry) return null;

  const lens = doc ? Lens.at<O>(doc, path.doc, path.slug) : undefined;
  const ui = lens?.at<t.ViewRendererProps>(['data', 'ui']);
  const currentView = ui?.get()?.view ?? '';
  const isCurrent = (id: t.StringId) => id === currentView;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);

  return (
    <KeyValue.View
      style={props.style}
      theme={theme.name}
      items={[
        { kind: 'title', v: 'View Renderer' },
        { k: 'slug view (id)', v: currentView ?? '-' },
        { k: 'cropmarks', v: wrangle.cropmarks(ui?.get()?.cropmarks?.size) },
        { kind: 'hr' },
        { kind: 'title', v: 'Trait Views' },
        ...registry.list().map((item) => {
          const id = item.id;
          const k = `• ${id}`;
          const v = isCurrent(id) ? `🌳` : '';
          return { k, v, x: 8 };
        }),
      ]}
    />
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
