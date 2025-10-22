import { Peer as PeerJS, type PeerOptions } from 'peerjs';
import { slug } from '../common.ts';

/**
 * REF: https://peerjs.com
 */
export function createPeer() {
  const peerId = `webrtc-peer-${slug()}`;
  console.info(`connecting: ${peerId}...`);

  const peerOptions: PeerOptions = {
    host: 'webrtc.db.team',
    port: 443, //       ← Force HTTPS.
    secure: true, //    ← TLS (Transport Layer Security).
    debug: 2, //        ← 0 = silent, 1 = errors, 2 = warnings+errors, 3 = all.
  };

  const peer = new PeerJS(peerId, peerOptions);
  peer.on('open', (id) => console.info('⚡️ peer.on/open:', id));
  peer.on('error', (err) => console.error('⚡️ peer.on/error: 💥', err));

  return peer;
}
