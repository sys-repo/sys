import type { t } from './common.ts';

/**
 * <Component>:
 */
export type SampleProps = {
  doc?: t.CrdtRef;
  peerjs?: t.PeerJSPeer;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
