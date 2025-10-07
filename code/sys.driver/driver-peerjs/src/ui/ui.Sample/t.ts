import type { t } from './common.ts';

export type SampleView = 'Room' | 'Debug' | 'FileShare' | 'Notes';

/**
 * <Component>:
 */
export type SampleProps = {
  repo?: t.Crdt.Repo;
  doc?: t.Crdt.Ref<t.SampleDoc>;
  peer?: t.PeerJS.Peer;
  remoteStream?: MediaStream;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: t.SampleReadyHandler;
  onSelect?: t.AvatarSelectHandler;
};

/**
 * Data:
 */
export type SampleDoc = {
  count: number;
  connections?: {
    ts: t.UnixTimestamp;
    group: t.WebRtc.PeerId[];
    dyads: t.WebRtc.PeerDyad[];
  };
};

/** Sample: Media stream coupled with the peer-id it related to. */
export type SamplePeerMedia = {
  readonly peer: t.WebRtc.PeerId;
  readonly stream: MediaStream;
};

/**
 * Events:
 */
/** Handler for when the sample is ready. */
export type SampleReadyHandler = (e: SampleReadyArgs) => void;
/** The sample ready event. */
export type SampleReadyArgs = { readonly self: SamplePeerMedia };

/**
 * —————————————————————————————————————————————————————————————————————————————————————————————
 */

/**
 * Dyad: Connection state flags.
 */
export type DyadConnectionState = { local: boolean; remote: boolean };

/**
 * Dyad: A live connection between a "dyad" (two-peers).
 */
export type DyadConnection = t.Lifecycle & {
  peers: t.WebRtc.PeerDyad;
  connected: DyadConnectionState;
};
