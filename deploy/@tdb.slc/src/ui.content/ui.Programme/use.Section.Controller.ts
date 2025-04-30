import { useState } from 'react';
import { type t, Signal } from './common.ts';
import { toPlaylist } from './u.playlist.ts';
import { CalcSection } from './u.ts';

type M = {
  root?: t.VideoMediaContent;
  section?: t.VideoMediaContent;
  child?: t.VideoMediaContent;
};

/**
 * Controls an individual section
 */
export function useSectionController(props: {
  content: t.ProgrammeContent;
  state: t.ProgrammeSignals;
  player: t.VideoPlayerSignals;
}) {
  const { content, state, player } = props;
  const [media, setMedia] = useState<M>({});
  const [playlist, setPlaylist] = useState<t.VideoMediaContent[]>([]);

  /**
   * Effects
   */
  Signal.useEffect(() => {
    const index = CalcSection.index(state);
    const media = CalcSection.media(state);
    const playlist = toPlaylist(media.section);
    player.props.src.value = playlist[index.child]?.video.src;

    setMedia(media);
    setPlaylist(playlist);
  });

  /**
   * API:
   */
  const api = {
    media,
    playlist,

    /**
     * Event Actions:
     */
    onChildSelected(childIndex: t.Index) {
      const section = state.props.section;
      if (section.value) section.value = { ...section.value, childIndex };
    },
  } as const;
  return api;
}
