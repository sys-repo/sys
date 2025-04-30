import { useState } from 'react';
import { type t, Signal } from './common.ts';
import { Calc, toPlaylist } from './u.ts';

type M = {
  root?: t.VideoMediaContent;
  section?: t.VideoMediaContent;
  child?: t.VideoMediaContent;
};

/**
 * Controls an individual section
 */
export function useSection(props: { state: t.ProgrammeSignals; player: t.VideoPlayerSignals }) {
  const { state, player } = props;

  const [playlist, setPlaylist] = useState<t.VideoMediaContent[]>([]);
  const [media, setMedia] = useState<M>({});
  const [current, setCurrent] = useState<t.VideoMediaContent>();

  /**
   * Effect: Current Media.
   */
  Signal.useEffect(() => {
    const index = Calc.Section.index(state);
    const media = Calc.Section.media(state);
    const playlist = toPlaylist(media.section);
    const current = playlist[index.child];

    setMedia(media);
    setCurrent(current);
    setPlaylist(playlist);

    player.props.src.value = current?.video.src;
  });

  /**
   * API:
   */
  return {
    playlist,
    media,
    current,

    /**
     * Event Actions:
     */
    onChildSelected(childIndex: t.Index) {
      const section = state.props.section;
      if (section.value) section.value = { ...section.value, childIndex };
    },
  } as const;
}
