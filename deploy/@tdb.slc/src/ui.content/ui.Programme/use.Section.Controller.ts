import { type t } from './common.ts';
import { CalcSection } from './u.ts';

/**
 * Controls an individual section
 */
export function useSectionController(state: t.ProgrammeSignals) {
  const p = state.props;

  /**
   * API:
   */
  const api = {
    get index() {
      return CalcSection.index(state);
    },

    get media() {
      return CalcSection.media(state);
    },

    get player() {
      return CalcSection.player(state);
    },

    get title() {
      return CalcSection.title(state);
    },

    /**
     * Event Actions:
     */
    onSelectChild(childIndex: t.Index) {
      const section = p.section;
      if (section.value) section.value = { ...section.value, childIndex };
    },
  } as const;
  return api;
}
