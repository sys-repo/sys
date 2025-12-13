import React from 'react';
import { useTimeline } from '../use.Timeline.ts';
import { type t, Color, css, dur, KeyValue, ObjectView, Str } from './common.ts';
import { toIssueItems } from './ui.InfoPanel.issues.tsx';

export type InfoPanelProps = {
  docid?: t.StringId;
  bundle?: t.SpecTimelineBundle;
  beat?: t.Timecode.Experience.Beat;
  index?: t.Index;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { debug = false, bundle, docid } = props;

  const { timeline, resolved } = useTimeline(bundle?.spec);
  if (!timeline) return null;
  if (!bundle) return null;

  const total = {
    segments: bundle.spec.composition.length,
    beats: timeline.beats.length,
    duration: dur(timeline.duration),
  };
  const plural = {
    segments: Str.plural(total.segments, 'segment', 'segments'),
    beats: Str.plural(total.beats, 'beat', 'beats'),
  };
  const size = `${total.segments} ${plural.segments} → ${total.beats} ${plural.beats}`;

  // Build items.
  const items: t.KeyValueItem[] = [];
  const add = (item: t.KeyValueItem) => items.push(item);
  const hr = () => add({ kind: 'hr' });

  const mono = true;
  add({ kind: 'title', v: 'Composite Timeline', y: [0, 10] });
  add({ k: 'Slug', v: docid ? `crdt:${docid}` : '-', mono, userSelect: 'text' });
  hr();
  add({ k: 'Composition Size', v: total.beats === 0 ? '-' : size });
  add({ k: 'Virtual Duration', v: total.duration });
  if (props.index !== undefined) {
    add({ kind: 'hr' });
    add({ k: 'Current Beat', v: props.index });
  }

  items.push(...toIssueItems(resolved));

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', Padding: [8, 15] }),
    kv: css({ marginBottom: 30, userSelect: 'none' }),
  };

  const obj = (n: string, d: unknown, marginTop = 5, expand = 1) => {
    return (
      <ObjectView
        name={n}
        data={d}
        fontSize={10}
        theme={theme.name}
        style={{ marginTop }}
        expand={expand}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View style={styles.kv} theme={theme.name} items={items} />

      {debug && obj('props.bundle', props.bundle)}
      {debug && props.beat && obj('props.beat', props.beat)}
    </div>
  );
};
