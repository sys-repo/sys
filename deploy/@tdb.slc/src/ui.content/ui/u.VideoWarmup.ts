import { type t, Arr } from './common.ts';
import { VIDEO } from '../-VIDEO.ts';
import { toPlaylist } from '../ui.Programme/u.playlist.ts';

function unique(urls: readonly string[]) {
  return Arr.uniq(urls.filter(Boolean));
}

export const VideoWarmup = {
  landing() {
    return unique([VIDEO.Trailer.src, VIDEO.Overview.src]);
  },

  programmeIntro(media?: t.VideoMediaContent) {
    const sections = media?.children ?? [];
    const urls = sections
      .map((section) => toPlaylist(section))
      .map((playlist) => playlist[0]?.video.src)
      .filter(Boolean);

    return unique(urls);
  },

  section(media?: t.VideoMediaContent) {
    const playlist = toPlaylist(media).slice(1);
    return unique(playlist.map((item: t.VideoMediaContent) => item.video.src));
  },
} as const;
