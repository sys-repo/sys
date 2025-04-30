import { type t } from './common.ts';
import { useSectionController } from './use.Section.Controller.ts';

export function useController(props: {
  content: t.ProgrammeContent;
  state: t.ProgrammeSignals;
  player: t.VideoPlayerSignals;
}) {
  const { content, state, player } = props;
  const media = state.props.media;
  const p = state.props;

  /**
   * Child controllers:
   */
  const section = useSectionController({ content, state, player });

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
