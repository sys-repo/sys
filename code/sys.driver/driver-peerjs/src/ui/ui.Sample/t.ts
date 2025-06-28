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
    timestamp: t.UnixTimestamp;
    group: t.WebRtc.PeerId[];
    dyads: t.WebRtc.PeerDyad[];
  };
};

export type SamplePeerMedia = {
  readonly peer: t.WebRtc.PeerId;
  readonly stream: MediaStream;
};

/**
 * Events:
 */
export type SampleReadyHandler = (e: SampleReadyArgs) => void;
export type SampleReadyArgs = { readonly self: SamplePeerMedia };
