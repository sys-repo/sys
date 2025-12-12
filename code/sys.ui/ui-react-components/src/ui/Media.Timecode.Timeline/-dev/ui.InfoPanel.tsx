import React from 'react';
import { useTimeline } from '../use.Timeline.ts';
import { type t, Color, css, dur, KeyValue, ObjectView, Str } from './common.ts';

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

  const { timeline } = useTimeline(bundle?.spec);
  if (!timeline) return null;
  if (!bundle) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      Padding: [8, 15],
    }),
    kv: css({
      marginBottom: 30,
      userSelect: 'none',
    }),
  };

  const obj = (n: string, d: unknown, marginTop = 5, expand = 1) => {
    return (
      <ObjectView
        //
        fontSize={10}
        theme={theme.name}
        name={n}
        data={d}
        style={{ marginTop }}
        expand={expand}
      />
    );
  };

  const total = {
    segments: bundle.spec.composition.length,
    beats: timeline.beats.length,
    duration: dur(timeline.duration),
  };
  const size = `${total.segments} segments → ${total.beats} ${Str.plural(total.beats, 'beat', 'beats')}`;

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View
        style={styles.kv}
        theme={theme.name}
        items={[
          { kind: 'title', v: 'Composite Timeline', y: [0, 10] },
          { k: 'Slug', v: docid ? `crdt:${docid}` : '-', mono: true, userSelect: 'text' },
          { kind: 'hr' },
          { k: 'Composition Size', v: size },
          { k: 'Virtual Duration', v: total.duration },
          { kind: 'hr' },
          { k: 'Current Beat', v: props.index },
        ]}
      />

      {debug && obj('props.bundle', props.bundle)}
      {debug && obj('props.beat', props.beat)}
    </div>
  );
};
