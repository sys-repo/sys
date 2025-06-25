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
};

/**
 * Data:
 */
export type SampleDoc = {
  count: number;
  connections?: {
    group: t.WebRtc.PeerId[];
    dyads: t.WebRtc.PeerDyad[];
  };
};

export type SamplePeerMedia = {
  readonly stream: MediaStream;
  readonly peer: t.WebRtc.PeerId;
};

/**
 * Events:
 */
export type SampleReadyHandler = (e: SampleReadyArgs) => void;
export type SampleReadyArgs = { readonly self: SamplePeerMedia };
