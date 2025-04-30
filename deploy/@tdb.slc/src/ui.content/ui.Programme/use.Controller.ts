import { type t } from './common.ts';
import { useSection } from './use.Section.ts';

export function useController(props: { state: t.ProgrammeSignals; player: t.VideoPlayerSignals }) {
  const { state, player } = props;
  const media = state.props.media;
  const p = state.props;

  /**
   * Child controllers:
   */
  const section = useSection({ state, player });

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
    onSectionSelected(index: t.Index) {
      p.section.value = { index };
      p.align.value = 'Right';
    },

    onBackClick() {
      p.align.value = 'Center';
      p.section.value = undefined;
    },
  } as const;
  return api;
}
