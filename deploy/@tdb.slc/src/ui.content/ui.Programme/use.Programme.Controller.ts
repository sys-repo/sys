import { type t, Signal } from './common.ts';
import { useSectionController } from './use.Section.Controller.ts';

export function useProgrammeController(state: t.ProgrammeSignals) {
  const media = state.props.media;
  const p = state.props;

  /**
   * Child controllers:
   */
  const section = useSectionController(state);

  /**
   * API:
   */
  const api = {
    section,

    get media() {
      return media.value;
    },

    /**
     * Event Actions:
     */
    onSelectSection(index: t.Index) {
      p.align.value = 'Right';
      p.section.value = { index };
    },

    onBackClick() {
      p.align.value = 'Center';
      p.section.value = undefined;
    },
  } as const;
  return api;
}
