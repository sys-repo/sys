import type { InfoPanelProps } from './ui.InfoPanel.tsx';

import React from 'react';
import { type t, Button, css, dur, Json, KeyValue, Str, Timecode } from './common.ts';
import { toIssueItems } from './ui.InfoPanel.KV.toIssueItems.tsx';

type O = Record<string, unknown>;
type P = Pick<InfoPanelProps, 'docid' | 'index' | 'bundle' | 'snapshot'> & {
  experience?: t.Timecode.Experience.Timeline;
  resolved?: t.Timecode.Resolved;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const KV: React.FC<P> = (props) => {
  const { docid, bundle, experience, resolved, snapshot } = props;
  if (!bundle || !experience || !resolved) return null;

  const handleCopy = () => {
    const data = rows.reduce<O>((acc, next) => {
      acc[String(next.k)] = next.v;
      return acc;
    }, {});
    navigator.clipboard.writeText(Json.stringify(data));
  };

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
  const rows: t.KeyValueRow[] = [];
  const items: t.KeyValueItem[] = [];
  const add = (item: t.KeyValueItem) => {
    items.push(item);
    if (!item.kind || item.kind === 'row') rows.push(item);
  };
  const hr = () => items.push({ kind: 'hr' });
  const vTime = snapshot?.state?.vTime;
  const currentTime = formatTime(vTime);

  const mono = true;
  add({ kind: 'title', v: 'Composite Timeline', y: [0, 10] });
  add({ k: 'Slug', v: docid ? `crdt:${docid}` : '-', mono, userSelect: 'text' });
  hr();
  add({ k: 'Composition', v: total.beats === 0 ? '-' : size });
  add({ k: 'Virtual Duration', v: total.duration, mono });
  if (props.index !== undefined) add({ k: 'Time', v: currentTime, mono });
  if (snapshot?.state) {
    const state = snapshot.state;
    const active = state.decks.active;
    const standby = state.decks.standby;
    const deckSummary = (deck: t.TimecodeState.Playback.DeckId) => {
      const role = deck === active ? 'active' : deck === standby ? 'standby' : '-';
      const status = state.decks.status[deck] ?? '-';
      const ready = state.ready.deck?.[deck] ? undefined : 'not-ready';
      return [role, ready, status].filter(Boolean).join(' | ');
    };
    const beat = state.currentBeat != null ? `beat-${state.currentBeat + 1}` : '-';
    hr();
    add({ k: 'Current Beat', v: beat, mono });
    add({ k: 'Phase', v: state.phase ?? '-', mono });
    add({ k: 'Intent', v: state.intent ?? '-', mono });
    add({ k: 'Deck-A', v: deckSummary('A'), mono });
    add({ k: 'Deck-B', v: deckSummary('B'), mono });
  }
  hr();
  items.push({
    k: 'Clipboard',
    v: <Button label={'Copy'} theme={props.theme} onClick={handleCopy} />,
  });
  items.push(...toIssueItems(resolved));

  /**
   * Render:
   */
  const styles = {
    base: css({ userSelect: 'none' }),
  };

  return <KeyValue.View style={css(styles.base, props.style)} theme={props.theme} items={items} />;
};

/**
 * Helpers:
 */
function formatTime(ms?: t.Msecs) {
  return ms == null ? '-' : Timecode.format(ms, { forceHours: true });
}
