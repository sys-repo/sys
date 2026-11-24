import { Anchor } from '../../Anchor/mod.ts';
import { Buttons as ButtonFamily } from '../../Buttons/mod.ts';
import { Chip } from '../../Chip/mod.ts';
import { ProseMarkdown } from '../mod.ts';
import { css, type t } from './common.ts';

const sourceBreakRenderers = {
  thematicBreak: ProseMarkdown.ThematicBreak.source,
} as const satisfies t.ProseMarkdown.Renderers;

export const Sample = { renderersFor } as const;

function renderersFor(
  sample: unknown,
  theme?: t.CommonTheme,
): t.ProseMarkdown.Renderers {
  const inlineCode: t.ProseMarkdown.Inline.Code.Renderer = ({ value }) => {
    return <Chip.UI size='xs' mono theme={theme}>{value}</Chip.UI>;
  };

  if (sample === 'thematic-breaks') {
    return { ...sourceBreakRenderers, inlineCode };
  }

  if (sample === 'chip') {
    return {
      ...sourceBreakRenderers,
      inlineCode,
      link({ href, title, children }) {
        return (
          <Anchor.UI href={href} title={title} target='_blank' theme={theme}>{children}</Anchor.UI>
        );
      },
    };
  }

  if (sample === 'task-state') {
    return {
      ...sourceBreakRenderers,
      taskState({ checked, ariaLabel }) {
        return (
          <span
            aria-checked={checked}
            aria-label={ariaLabel}
            aria-readonly
            className={Styles.taskState.class}
            role='switch'
          >
            <span aria-hidden inert>
              <ButtonFamily.Switch
                value={checked}
                width={26}
                height={14}
                theme={theme}
                transitionSpeed={0}
              />
            </span>
          </span>
        );
      },
    };
  }

  return { ...sourceBreakRenderers };
}

const Styles = {
  taskState: css({
    display: 'inline-flex',
    cursor: 'default',
    pointerEvents: 'none',
    marginTop: '0.1em',
  }),
};
