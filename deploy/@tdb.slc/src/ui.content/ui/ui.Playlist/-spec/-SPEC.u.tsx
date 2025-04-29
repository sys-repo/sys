import React from 'react';
import { Programme } from '../../../ui.Programme/mod.ts';
import { type t, Button, css } from '../common.ts';

type P = t.PlaylistProps;

export const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
  }),
};

/**
 * Dev Helpers:
 */
export function itemsButtons(signal: t.Signal<P['items']>, options: { title?: string } = {}) {
  const { title = 'Playlist.items:' } = options;
  const children: t.ReactNode[] = [];

  const btn = (value?: P['items'], title?: string) => {
    const toLabel = (input: string) => {
      const suffix = title ? ` — "${title}"` : '';
      return `items: ${input} ${suffix}`.trim();
    };
    const el = (
      <Button
        block
        key={`items-${children.length}`}
        label={() => {
          if (value == null) return toLabel('<undefined>');
          if (Array.isArray(value)) return toLabel(`array [${value.length}]`);
          return '🐷:unknown';
        }}
        onClick={() => (signal.value = value)}
        subscribe={() => signal.value}
      />
    );
    children.push(el);
  };

  const Media = Programme.Media;
  const Calc = Programme.Calc;
  Media.children.forEach((m) => btn(Calc.Section.toPlaylist(m), `${m.title ?? 'Untitled'}`));
  btn();

  return (
    <React.Fragment key={'dev:playlist-items'}>
      <div className={Styles.title.class}>{title}</div>
      {children}
    </React.Fragment>
  );
}
