import React from 'react';
import { type t, Is, Time, Button, css, dur, Json, KeyValue, Str, Timecode } from '../common.ts';
import { toIssueItems } from './ui.InfoPanel.u.tsx';

type O = Record<string, unknown>;
type Bundle = t.TimecodePlaybackDriver.Wire.Bundle;
type State = t.TimecodeState.Playback.State;
type Timeline = t.Timecode.Experience.Timeline;

export type InfoPanelProps = {
  index?: t.Index;
  bundle?: Bundle;
  snapshot?: t.TimecodeState.Playback.Snapshot;
  experience?: Timeline;
  resolved?: t.Timecode.Resolved;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { bundle, experience, resolved, snapshot } = props;
  if (!bundle || !experience || !resolved) return null;

  /**
   * Hooks:
   */
  const [copied, setCopied] = React.useState(false);

  /**
   * Handlers:
   */
  const handleCopy = () => {
    const data = rows.reduce<O>((acc, next) => {
      acc[String(next.k)] = next.v;
      return acc;
    }, {});
    navigator.clipboard.writeText(Json.stringify(data));
    setCopied(true);
    Time.delay(1500, () => setCopied(false));
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
  const mono = true;
  const rows: t.KeyValueRow[] = [];
  const items: t.KeyValueItem[] = [];
  const add = (item: t.KeyValueItem) => {
    items.push(item);
    if (!item.kind || item.kind === 'row') rows.push(item);
  };
  const hr = () => items.push({ kind: 'hr' });
  const vTime = snapshot?.state?.vTime;
  const currentTime = formatTime(vTime);
  const docid = bundle.docid;

  add({ kind: 'title', v: 'Composite Timeline', y: [0, 10] });
  add({ k: 'Slug', v: docid ? `crdt:${docid}` : '-', mono, userSelect: 'text' });
  hr();
  add({ k: 'Composition', v: total.beats === 0 ? '-' : size, mono });
  add({ k: 'Virtual Duration', v: total.duration, mono });
  if (props.index !== undefined) add({ k: 'Time', v: currentTime, mono });
  if (snapshot?.state) {
    const state = snapshot.state;

    const active = state.decks.active;
    const standby = state.decks.standby;
    const currentBeat = state.currentBeat;
    const beat = currentBeat != null ? experience.beats[currentBeat] : undefined;
    const logicalPath = beat?.src?.ref;
    const asset = logicalPath ? bundle.resolveAsset({ kind: 'video', logicalPath }) : undefined;
    const bytes = asset?.stats?.bytes;
    const duration = asset?.stats?.duration;

    const deckSummary = (deck: t.TimecodeState.Playback.DeckId) => {
      const role = deck === active ? 'active' : deck === standby ? 'standby' : '-';
      const status = state.decks.status[deck] ?? '-';
      const ready = state.ready.deck?.[deck] ? undefined : 'not-ready';
      return [role, ready, status].filter(Boolean).join(' | ');
    };

    hr();
    add({ kind: 'title', v: 'Current' });
    add({ k: 'Position', v: formatPosition(state), mono });
    // add({ k: 'Phase', v: state.phase ?? '-', mono });
    add({ k: 'Intent', v: state.intent ?? '-', mono });
    add({ k: 'Deck-A', v: deckSummary('A'), mono });
    add({ k: 'Deck-B', v: deckSummary('B'), mono });

    hr();
    add({ kind: 'title', v: 'Media' });
    if (Is.number(bytes)) add({ k: 'Byte Size', v: Str.bytes(bytes), mono });
    if (duration != null) add({ k: 'Total Duration', v: formatTime(duration), mono });
  }
  hr();
  items.push({
    k: 'Clipboard',
    v: <Button label={copied ? '(copied) ✔' : 'Copy'} theme={props.theme} onClick={handleCopy} />,
  });
  items.push(...toIssueItems(resolved));

  /**
   * Render:
   */
  const styles = {
    base: css({ userSelect: 'none' }),
  };

  return <KeyValue.UI style={css(styles.base, props.style)} theme={props.theme} items={items} />;
};

/**
 * Helpers:
 */
function formatTime(ms?: t.Msecs) {
  return ms == null ? '-' : Timecode.format(ms, { forceHours: true });
}

function formatPosition(state: State) {
  const index = state.currentBeat;
  const timeline = state.timeline;
  if (index == null || !timeline) return undefined;

  const segIndex = timeline.segments
    .map((s) => s.beat)
    .findIndex((beat) => beat.from <= index && index < beat.to);

  if (segIndex < 0) return undefined;
  return `segment-${segIndex + 1}:beat-${index + 1}`;
}
