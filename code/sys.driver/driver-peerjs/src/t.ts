import type { t } from './common.ts';

/**
 * Namespace of WebRTC related concepts.
 */
export namespace WebRtc {
  /** String representing the unique identifier of a peer on the network. */
  export type PeerId = t.StringId;
  /** A tuple represeting a 1:1 peer-id relationship. */
  export type PeerDyad = readonly [PeerId, PeerId];
}
