import { type t } from './common.ts';

export const Fake: t.DomMockFakeLib = {
  Media: {
    stream(input?: Partial<{ id: string; active: boolean }>): MediaStream {
      const id = input?.id ?? 'stream-1';
      const active = input?.active ?? true;

      const streamLike = {
        id,
        active,

        // Required for Media.Is.mediaStream duck-branch:
        getTracks: () => [] as MediaStreamTrack[],

        // Required for Media.ToObject.stream:
        getAudioTracks: () => [] as MediaStreamTrack[],
        getVideoTracks: () => [] as MediaStreamTrack[],

        // Extra surface: harmless defaults
        addTrack: () => undefined,
        removeTrack: () => undefined,
        clone: () => streamLike as unknown as MediaStream,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
        onaddtrack: null,
        onremovetrack: null,
      };

      return streamLike as unknown as MediaStream;
    },

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
    ): MediaStreamTrack {
      const id = input?.id ?? 'track-1';
      const kind = input?.kind ?? 'video';
      const enabled = input?.enabled ?? true;
      const readyState = input?.readyState ?? 'live';
      const label = input?.label ?? '';
      const settings = input?.settings ?? ({} as MediaTrackSettings);
      const muted = input?.muted ?? false;

      const trLike = {
        id,
        kind,
        enabled,
        readyState,
        label,

        // Required for Media.Is.track:
        getSettings: () => settings,

        // Extra interface stubs:
        applyConstraints: async () => undefined,
        clone: () => trLike as unknown as MediaStreamTrack,
        getCapabilities: () => ({}) as MediaTrackCapabilities,
        getConstraints: () => ({}) as MediaTrackConstraints,
        onended: null,
        onmute: null,
        onunmute: null,
        contentHint: '',
        muted,
        stop: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      };

      return trLike as unknown as MediaStreamTrack;
    },
  },
};
