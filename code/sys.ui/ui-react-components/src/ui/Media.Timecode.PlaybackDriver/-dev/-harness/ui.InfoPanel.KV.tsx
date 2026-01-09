import type { InfoPanelProps } from './ui.InfoPanel.tsx';

import React from 'react';
import { type t, css, dur, KeyValue, Str } from './common.ts';
import { toIssueItems } from './ui.InfoPanel.KV.toIssueItems.tsx';

type P = Pick<InfoPanelProps, 'docid' | 'index' | 'bundle'> & {
  experience?: t.Timecode.Experience.Timeline;
  resolved?: t.Timecode.Resolved;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const KV: React.FC<P> = (props) => {
  const { docid, bundle, experience, resolved } = props;

  if (!bundle || !experience || !resolved) return null;

  const total = {
    segments: bundle.spec.composition.length,
    beats: experience.beats.length,
    duration: dur(experience.duration),
  } as const;
  const plural = {
    segments: Str.plural(total.segments, 'segment', 'segments'),
    beats: Str.plural(total.beats, 'beat', 'beats'),
  } as const;
  const size = `${total.segments} ${plural.segments} → ${total.beats} ${plural.beats}`;

  /**
   * Build items:
   */
  const items: t.KeyValueItem[] = [];
  const add = (item: t.KeyValueItem) => items.push(item);
  const hr = () => add({ kind: 'hr' });

  const mono = true;
  add({ kind: 'title', v: 'Composite Timeline', y: [0, 10] });
  add({ k: 'Slug', v: docid ? `crdt:${docid}` : '-', mono, userSelect: 'text' });
  hr();
  add({ k: 'Composition', v: total.beats === 0 ? '-' : size });
  add({ k: 'Virtual Duration', v: total.duration });
  if (props.index !== undefined) add({ k: 'Current Beat', v: props.index + 1 });
  items.push(...toIssueItems(resolved));

  /**
   * Render:
   */
  const styles = {
    base: css({ userSelect: 'none' }),
  };

  return <KeyValue.View style={css(styles.base, props.style)} theme={props.theme} items={items} />;
};
