import { Button } from '../../u.ts';
import { Anchor } from '../../Anchor/mod.ts';
import { Buttons as ButtonFamily } from '../../Buttons/mod.ts';
import { Chip } from '../../Chip/mod.ts';
import { ProseMarkdown } from '../mod.ts';
import { css, type t } from './common.ts';
import { MarkdownSample, type SampleItem, type SampleKind } from './-samples.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type SampleButtonsProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};
export type { SampleKind };

const sourceBreakRenderers = {
  thematicBreak: ProseMarkdown.ThematicBreak.source,
} as const satisfies t.ProseMarkdown.Renderers;

export const Sample = {
  Buttons,
  renderersFor,
  value: MarkdownSample.value,
} as const;

function Buttons(props: SampleButtonsProps) {
  const p = props.debug.props;
  const theme = p.theme.value;

  const button = (kind: SampleKind) => {
    const sample = MarkdownSample.get(kind);
    const selected = p.sample.value === kind;
    return (
      <Button
        key={kind}
        block
        label={renderButtonLabel({ kind, sample, selected, theme })}
        onClick={() => props.debug.select(kind)}
      />
    );
  };

  return (
    <div className={css(Styles.base, props.style).class}>
      {MarkdownSample.kinds.map((kind) => button(kind))}
    </div>
  );
}

function renderButtonLabel(args: {
  kind: SampleKind;
  sample: SampleItem;
  selected: boolean;
  theme?: t.CommonTheme;
}) {
  const { kind, sample, selected, theme } = args;
  const prefix = selected ? '🌳 ' : '';
  return (
    <ProseMarkdown.UI
      value={`${prefix}${sample.label}`}
      theme={theme}
      renderers={renderersFor(kind, theme)}
      style={Styles.buttonLabelMarkdown}
    />
  );
}

function renderersFor(
  sample: unknown,
  theme?: t.CommonTheme,
): t.ProseMarkdown.Renderers {
  const inlineCode: t.ProseMarkdown.Inline.Code.Renderer = ({ value }) => (
    <Chip.UI size='xs' mono theme={theme}>{value}</Chip.UI>
  );

  if (sample === 'thematic-breaks') {
    return { ...sourceBreakRenderers, inlineCode };
  }

  if (sample === 'chip') {
    return {
      ...sourceBreakRenderers,
      inlineCode,
      link: ({ href, title, children }) => (
        <Anchor.UI href={href} title={title} target='_blank' theme={theme}>{children}</Anchor.UI>
      ),
    };
  }

  if (sample === 'task-state') {
    return {
      ...sourceBreakRenderers,
      taskState: ({ checked, ariaLabel }) => (
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
      ),
    };
  }

  return { ...sourceBreakRenderers };
}

const Styles = {
  base: css({}),
  buttonLabelMarkdown: css({ display: 'inline-block' }),
  taskState: css({
    display: 'inline-flex',
    cursor: 'default',
    pointerEvents: 'none',
    marginTop: '0.1em',
  }),
};
