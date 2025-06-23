import type { t } from './common.ts';

/**
 * <Component>:
 */
export type SampleProps = {
  doc?: t.CrdtRef<t.TSampleDoc>;
  peerjs?: t.PeerJS.Peer;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Data:
 */
export type TSampleDoc = {
  count: number;
  connections?: {
    group: t.WebRtc.PeerId[];
    dyads: t.WebRtc.PeerDyad[];
  };
};
