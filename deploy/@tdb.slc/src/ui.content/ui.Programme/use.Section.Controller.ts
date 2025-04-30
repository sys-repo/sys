import { useState } from 'react';

import { type t, Signal } from './common.ts';
import { CalcSection } from './u.ts';

type M = {
  root?: t.VideoMediaContent;
  section?: t.VideoMediaContent;
  child?: t.VideoMediaContent;
};

/**
 * Controls an individual section
 */
export function useSectionController(state: t.ProgrammeSignals) {
  const [media, setMedia] = useState<M>({});

  /**
   * Effects
   */
  Signal.useEffect(() => {
    setMedia(CalcSection.media(state));
  });

  /**
   * API:
   */
  const api = {
    media,

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
