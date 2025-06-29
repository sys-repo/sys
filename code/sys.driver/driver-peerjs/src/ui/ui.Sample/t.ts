import type { t } from './common.ts';

/**
 * <Component>:
 */
export type SampleProps = {
  doc?: t.CrdtRef<t.SampleDoc>;
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
