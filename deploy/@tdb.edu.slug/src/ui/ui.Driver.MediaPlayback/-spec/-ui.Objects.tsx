import React from 'react';
import { type t, ObjectView, PlaybackDriver } from './common.ts';

export type HeadObjectProps = {
  readonly data: HeadObjectData;
  readonly theme?: t.CommonTheme;
  readonly style?: t.CssInput;
};

export type PayloadObjectProps = {
  readonly data: PayloadObjectData;
  readonly theme?: t.CommonTheme;
  readonly style?: t.CssInput;
};

export type HeadObjectData = {
  readonly selectedRef?: string;
  readonly phase: t.TreeContentController.Phase;
  readonly key?: string;
  readonly docid?: t.StringId;
  readonly beats?: number;
  readonly assets?: number;
};

export type PayloadObjectData = {
  readonly playback?: t.SpecTimelineManifest;
  readonly snapshot?: t.TimecodeState.Playback.Snapshot;
};

/**
 * Component:
 */
export const HeadObject: React.FC<HeadObjectProps> = (props) => {
  return (
    <ObjectView
      theme={props.theme}
      name={'head:media-playback'}
      data={props.data}
      expand={0}
      style={props.style}
    />
  );
};

/**
 * Component:
 */
export const PayloadObject: React.FC<PayloadObjectProps> = (props) => {
  const payload = usePayload(props.data);
  return (
    <ObjectView
      theme={props.theme}
      name={'payload'}
      data={payload}
      expand={0}
      style={props.style}
    />
  );
};

function usePayload(data: PayloadObjectData) {
  const timeline = PlaybackDriver.Util.usePlaybackTimeline({
    spec: data.playback
      ? { composition: data.playback.composition, beats: data.playback.beats }
      : undefined,
  });
  const beats = timeline.experience?.beats ?? [];
  const currentBeat = data.snapshot?.state.currentBeat;
  const beat = currentBeat != null ? beats[currentBeat] : undefined;
  return beat?.payload;
}
