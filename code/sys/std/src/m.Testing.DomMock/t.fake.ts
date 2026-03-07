import type { t } from './common.ts';

export type DomMockFakeLib = {
  readonly Media: t.DomMockFakeMediaLib;
};

export type DomMockFakeMediaLib = {
  stream(input?: Partial<{ id: string; active: boolean }>): MediaStream;
  track(
    input?: Partial<{
      id: string;
      kind: 'audio' | 'video';
      enabled: boolean;
      readyState: MediaStreamTrackState;
      label: string;
      settings: MediaTrackSettings;
      muted: boolean;
    }>,
  ): MediaStreamTrack;
};
