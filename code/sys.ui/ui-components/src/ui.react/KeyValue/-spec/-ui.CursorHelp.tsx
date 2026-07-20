import React from 'react';
import { Chip, Color, css, ProseMarkdown, Str, type t } from './common.ts';

type Step = { readonly gesture: string; readonly text: string };

export type CursorHelpProps = {
  readonly theme?: t.CommonTheme;
  readonly extraSteps?: readonly Step[];
  readonly style?: t.CssInput;
};

const steps: readonly Step[] = [
  { gesture: 'Option + ←/→', text: 'enters key/value lanes.' },
  { gesture: '↑/↓', text: 'moves cursor.' },
  { gesture: 'Option + ↑/↓', text: 'moves by hr-delimited blocks.' },
  { gesture: 'Home/End · Command/Ctrl + ↑/↓', text: 'moves to top/bottom.' },
  { gesture: 'Enter', text: 'enters groups.' },
  { gesture: 'Esc', text: 'exits.' },
];

const toMarkdown = (items: readonly Step[]) => {
  const intro = Str.dedent(`
    \`Option-click\` a row, or \`Option + Enter\` to focus.

    Once focused:
  `);
  const list = items.map((step) => `- \`${step.gesture}\` ${step.text}`).join('\n');
  return `${intro}\n\n${list}`;
};

export const CursorHelp: React.FC<CursorHelpProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: Color.alpha(theme.fg, 0.66),
      fontSize: 12,
      lineHeight: 1.45,
      marginTop: 5,
      marginBottom: 8,
      marginLeft: 8,
    }),
  };

  const renderers: t.ProseMarkdown.Renderers = {
    inlineCode: (e) => <Chip.UI mono theme={theme.name} size='sm'>{e.value}</Chip.UI>,
  };

  return (
    <ProseMarkdown.UI
      value={toMarkdown([...steps, ...(props.extraSteps ?? [])])}
      renderers={renderers}
      theme={theme.name}
      style={css(styles.base, props.style)}
    />
  );
};
