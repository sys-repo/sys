import { VIDEO } from '../-VIDEO.ts';
import { type t, App, DEFAULTS, v } from './common.ts';
import { Programme } from './ui.tsx';
import { Programme as Media } from './v.ts';

/**
 * Content: "Programme"
 */
export function factory(options: t.ContentFactoryOptions = {}) {
  const { muted = false } = options;

  /**
   * Content definition:
   */
  const content: t.ProgrammeContent = {
    id: 'Programme',
    kind: 'VideoContent',

    playOnLoad: true,
    media: {
      id: 'programme.root',
      video: v(VIDEO.Programme.Root.src),
      timestamps: {},
      children: Media.children(),
    },

    render(props) {
      const global = props.state;
      const isTop = props.index === global.stack.length - 1;

      return (
        <Programme
          content={content}
          theme={DEFAULTS.theme.sheet}
          isTop={isTop}
          muted={muted}
          onCloseRequest={() => global.stack.pop()}
        />
      );
    },
  };

  App.Render.preloadTimestamps(content.media);
  return content;
}
