import React, { useRef } from 'react';
import { type t, Signal } from './common.ts';

export function useProgrammeController(state: t.ProgrammeState) {
  const media = state.component.props.media;
  const rootMediaRef = useRef(media);

  Signal.useEffect(() => {
  });

  /**
   *
   */
  Signal.useEffect(() => {
    const player = media.value?.video;
    const isPlaying = player?.is.playing;
  });

  /**
   * API:
   */
  const api = {
    onMenuSelect(index: t.Index) {
      const p = state.component?.props;
      if (p) {
        p.align.value = 'Right';
        p.section.value = { index };
      }
    },

    onBlackClick() {
      const p = state.component?.props;
      if (p) {
        p.align.value = 'Center';
        p.section.value = undefined;
      }
    },
  } as const;
  return api;
}
