type TH = { onMute: () => void; onUnmute: () => void; onEnded: () => void };
const TRACK_HANDLERS = new WeakMap<MediaStreamTrack, TH>();

export function attachTelemetry(s: MediaStream, log?: (msg: string) => void) {
  s.getAudioTracks().forEach((track) => {
    const onMute = () => log?.('audio mute');
    const onUnmute = () => log?.('audio unmute');
    const onEnded = () => log?.('audio ended');
    track.addEventListener('mute', onMute);
    track.addEventListener('unmute', onUnmute);
    track.addEventListener('ended', onEnded);
    TRACK_HANDLERS.set(track, { onMute, onUnmute, onEnded });
  });
}

export function detachTelemetry(s?: MediaStream) {
  s?.getAudioTracks().forEach((track) => {
    const h = TRACK_HANDLERS.get(track);
    if (!h) return;
    track.removeEventListener('mute', h.onMute);
    track.removeEventListener('unmute', h.onUnmute);
    track.removeEventListener('ended', h.onEnded);
    TRACK_HANDLERS.delete(track);
  });
}
