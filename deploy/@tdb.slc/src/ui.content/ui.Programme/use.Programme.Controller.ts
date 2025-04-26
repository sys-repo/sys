import { type t, Signal } from './common.ts';

export function useProgrammeController(content: t.VideoContent, state: t.ProgrammeState) {
  Signal.useEffect(() => {
  });

  /**
   *
   */
  Signal.useEffect(() => {
    const player = content.media?.video;
    const isPlaying = player?.is.playing;

  });
}
