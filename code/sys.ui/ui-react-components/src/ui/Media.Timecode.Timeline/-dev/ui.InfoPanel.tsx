import React from 'react';
import { useTimeline } from '../use.Timeline.ts';
import { type t, Color, css, dur, KeyValue, ObjectView, Str } from './common.ts';
import { toIssueItems } from './ui.InfoPanel.issues.tsx';

type L = NonNullable<t.MediaTimelineHarnessProps['layout']>;

export type InfoPanelProps = {
  layout?: L['infopanel'];
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
  const { debug = false, bundle, docid, layout = {} } = props;

  /**
   * Hooks:
   */
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
  if (props.index !== undefined) {
    add({ k: 'Current Beat', v: props.index + 1 });
  }
  items.push(...toIssueItems(resolved));

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: layout?.bottom ? `1fr auto` : `1fr`,
    }),
    kv: css({ marginBottom: 30, userSelect: 'none' }),
    top: css({ Padding: [8, 15] }),
    bottom: css({}),
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

  const elTop = (
    <div className={styles.top.class}>
      <KeyValue.View style={styles.kv} theme={theme.name} items={items} />
      {debug && obj('props.bundle', props.bundle)}
      {debug && props.beat && obj('props.beat', props.beat)}
    </div>
  );

  const elBottom = layout.bottom && <div className={styles.bottom.class}>{layout.bottom}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      {elTop}
      {elBottom}
    </div>
  );
};
