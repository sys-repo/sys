import React from 'react';
import { Color, css, KeyValue, type t, Time, Timecode } from './common.ts';

export type InfoPanelProps = {
  debug?: boolean;
  docid?: t.StringId;
  bundle?: t.SpecTimelineBundle;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { debug = false, bundle, docid } = props;

  const timeline = React.useMemo(() => {
    if (!bundle) return undefined;
    const { spec } = bundle;
    const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);
    return Timecode.Experience.toTimeline(resolved, spec.beats);
  }, [bundle?.spec]);

  if (!bundle) return null;
  if (!timeline) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      Padding: [8, 15],
    }),
  };

  const dur = (ms: t.Msecs = 0) => String(Time.Duration.create(ms));

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View
        theme={theme.name}
        items={[
          { kind: 'title', v: 'Virtual Timeline' },
          { k: 'Document', v: docid ?? '-' },
          { kind: 'hr' },
          { k: 'Beats', v: timeline.beats.length },
          { k: 'Duration', v: dur(timeline.duration) },
          { k: 'Segments', v: bundle.spec.composition.length },
        ]}
      />
    </div>
  );
};
